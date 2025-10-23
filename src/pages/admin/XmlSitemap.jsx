import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, RefreshCw, CheckCircle, AlertCircle, Upload, Image, Video, Newspaper, FileStack } from "lucide-react";
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
    const [submitting, setSubmitting] = useState(false);
    const [sitemapXml, setSitemapXml] = useState('');
    const [imageSitemapXml, setImageSitemapXml] = useState('');
    const [videoSitemapXml, setVideoSitemapXml] = useState('');
    const [newsSitemapXml, setNewsSitemapXml] = useState('');
    const [sitemapIndexXml, setSitemapIndexXml] = useState('');
    const [flashMessage, setFlashMessage] = useState(null);

    // Statistics
    const [stats, setStats] = useState({
        totalUrls: 0,
        products: 0,
        categories: 0,
        pages: 0,
        images: 0,
        videos: 0,
        newsArticles: 0
    });

    // Settings
    const [seoSettingId, setSeoSettingId] = useState(null);
    const [settings, setSettings] = useState({
        sitemap_include_products: true,
        sitemap_include_categories: true,
        sitemap_include_pages: true,
        sitemap_include_images: false,
        sitemap_include_videos: false,
        sitemap_enable_news: false,
        sitemap_enable_index: false,
        sitemap_max_urls: 50000,
        google_search_console_api_key: '',
        sitemap_auto_submit: false
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

                    // Extract from JSON field
                    const xmlSettings = existingSettings.xml_sitemap_settings || {};

                    setSettings({
                        sitemap_include_products: xmlSettings.include_products ?? true,
                        sitemap_include_categories: xmlSettings.include_categories ?? true,
                        sitemap_include_pages: xmlSettings.include_pages ?? true,
                        sitemap_include_images: xmlSettings.include_images ?? false,
                        sitemap_include_videos: xmlSettings.include_videos ?? false,
                        sitemap_enable_news: xmlSettings.enable_news ?? false,
                        sitemap_enable_index: xmlSettings.enable_index ?? false,
                        sitemap_max_urls: xmlSettings.max_urls ?? 50000,
                        google_search_console_api_key: xmlSettings.google_search_console_api_key ?? '',
                        sitemap_auto_submit: xmlSettings.auto_submit ?? false
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

            // Generate standard sitemap
            const standardSitemap = generateStandardSitemap(products, categories, pages);
            setSitemapXml(standardSitemap.xml);

            // Generate image sitemap if enabled
            if (settings.sitemap_include_images) {
                const imageSitemap = generateImageSitemap(products, categories, pages);
                setImageSitemapXml(imageSitemap.xml);
                setStats(prev => ({ ...prev, images: imageSitemap.count }));
            }

            // Generate video sitemap if enabled
            if (settings.sitemap_include_videos) {
                const videoSitemap = generateVideoSitemap(products, pages);
                setVideoSitemapXml(videoSitemap.xml);
                setStats(prev => ({ ...prev, videos: videoSitemap.count }));
            }

            // Generate news sitemap if enabled
            if (settings.sitemap_enable_news) {
                const newsSitemap = generateNewsSitemap(pages);
                setNewsSitemapXml(newsSitemap.xml);
                setStats(prev => ({ ...prev, newsArticles: newsSitemap.count }));
            }

            // Generate sitemap index if enabled
            if (settings.sitemap_enable_index) {
                const indexSitemap = generateSitemapIndex(standardSitemap.count);
                setSitemapIndexXml(indexSitemap);
            }

            setStats(prev => ({
                ...prev,
                totalUrls: standardSitemap.stats.totalUrls,
                categories: standardSitemap.stats.categories,
                products: standardSitemap.stats.products,
                pages: standardSitemap.stats.pages
            }));
        } catch (error) {
            console.error('Error generating sitemap:', error);
            setFlashMessage({ type: 'error', message: 'Failed to generate sitemap' });
        } finally {
            setGenerating(false);
        }
    };

    const generateStandardSitemap = (products, categories, pages) => {
        const baseNamespace = settings.sitemap_include_images
            ? 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
            : 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${baseNamespace}>
  <url>
    <loc>${window.location.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;

        let urlCount = 1;
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
    <lastmod>${lastmod}</lastmod>`;

                // Add image if enabled and available
                if (settings.sitemap_include_images && category.image_url) {
                    xml += `
    <image:image>
      <image:loc>${category.image_url}</image:loc>
      <image:title>${category.name || 'Category Image'}</image:title>
    </image:image>`;
                }

                xml += `
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
    <lastmod>${lastmod}</lastmod>`;

                // Add images if enabled
                if (settings.sitemap_include_images) {
                    // Main image
                    if (product.image_url) {
                        xml += `
    <image:image>
      <image:loc>${product.image_url}</image:loc>
      <image:title>${product.name || 'Product Image'}</image:title>
      ${product.description ? `<image:caption>${product.description.substring(0, 256)}</image:caption>` : ''}
    </image:image>`;
                    }
                    // Gallery images
                    if (product.gallery_images && Array.isArray(product.gallery_images)) {
                        product.gallery_images.slice(0, 10).forEach((img, idx) => {
                            xml += `
    <image:image>
      <image:loc>${img.url || img}</image:loc>
      <image:title>${product.name} - Image ${idx + 1}</image:title>
    </image:image>`;
                        });
                    }
                }

                xml += `
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
    <lastmod>${lastmod}</lastmod>`;

                // Add image if enabled and available
                if (settings.sitemap_include_images && page.featured_image) {
                    xml += `
    <image:image>
      <image:loc>${page.featured_image}</image:loc>
      <image:title>${page.title || 'Page Image'}</image:title>
    </image:image>`;
                }

                xml += `
  </url>`;
                pageCount++;
            });
        }

        xml += '\n</urlset>';

        return {
            xml,
            count: urlCount + categoryCount + productCount + pageCount,
            stats: {
                totalUrls: urlCount + categoryCount + productCount + pageCount,
                categories: categoryCount,
                products: productCount,
                pages: pageCount
            }
        };
    };

    const generateImageSitemap = (products, categories, pages) => {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

        let imageCount = 0;

        // Product images
        products?.forEach(product => {
            if (product.image_url || (product.gallery_images && product.gallery_images.length > 0)) {
                xml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>`;

                if (product.image_url) {
                    xml += `
    <image:image>
      <image:loc>${product.image_url}</image:loc>
      <image:title>${product.name || 'Product'}</image:title>
      ${product.description ? `<image:caption>${product.description.substring(0, 256)}</image:caption>` : ''}
    </image:image>`;
                    imageCount++;
                }

                if (product.gallery_images && Array.isArray(product.gallery_images)) {
                    product.gallery_images.slice(0, 10).forEach((img, idx) => {
                        xml += `
    <image:image>
      <image:loc>${img.url || img}</image:loc>
      <image:title>${product.name} - ${idx + 1}</image:title>
    </image:image>`;
                        imageCount++;
                    });
                }

                xml += `
  </url>`;
            }
        });

        xml += '\n</urlset>';
        return { xml, count: imageCount };
    };

    const generateVideoSitemap = (products, pages) => {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

        let videoCount = 0;

        // Product videos
        products?.forEach(product => {
            if (product.video_url) {
                xml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>
    <video:video>
      <video:thumbnail_loc>${product.video_thumbnail || product.image_url}</video:thumbnail_loc>
      <video:title>${product.name}</video:title>
      <video:description>${product.description || product.name}</video:description>
      <video:content_loc>${product.video_url}</video:content_loc>
      <video:publication_date>${formatDate(product.createdAt || product.created_date)}</video:publication_date>
    </video:video>
  </url>`;
                videoCount++;
            }
        });

        // CMS page videos
        pages?.forEach(page => {
            if (page.video_url) {
                xml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <video:video>
      <video:thumbnail_loc>${page.video_thumbnail || page.featured_image}</video:thumbnail_loc>
      <video:title>${page.title}</video:title>
      <video:description>${page.content?.substring(0, 500) || page.title}</video:description>
      <video:content_loc>${page.video_url}</video:content_loc>
      <video:publication_date>${formatDate(page.createdAt || page.created_date)}</video:publication_date>
    </video:video>
  </url>`;
                videoCount++;
            }
        });

        xml += '\n</urlset>';
        return { xml, count: videoCount };
    };

    const generateNewsSitemap = (pages) => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

        let newsCount = 0;

        // Only include recent pages (within last 2 days for Google News)
        pages?.forEach(page => {
            const pageDate = new Date(page.createdAt || page.created_date);
            if (pageDate >= twoDaysAgo && page.is_news_article) {
                xml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${store?.name || 'Store'}</news:name>
        <news:language>${page.language || 'en'}</news:language>
      </news:publication>
      <news:publication_date>${pageDate.toISOString()}</news:publication_date>
      <news:title>${page.title}</news:title>
    </news:news>
  </url>`;
                newsCount++;
            }
        });

        xml += '\n</urlset>';
        return { xml, count: newsCount };
    };

    const generateSitemapIndex = (totalUrls) => {
        const numSitemaps = Math.ceil(totalUrls / settings.sitemap_max_urls);
        const baseUrl = window.location.origin;

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;

        if (settings.sitemap_include_images && stats.images > 0) {
            xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-images.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
        }

        if (settings.sitemap_include_videos && stats.videos > 0) {
            xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-videos.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
        }

        if (settings.sitemap_enable_news && stats.newsArticles > 0) {
            xml += `
  <sitemap>
    <loc>${baseUrl}/sitemap-news.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
        }

        xml += '\n</sitemapindex>';
        return xml;
    };

    const submitToGoogle = async () => {
        if (!settings.google_search_console_api_key) {
            setFlashMessage({
                type: 'error',
                message: 'Google Search Console API key is required for auto-submission'
            });
            return;
        }

        try {
            setSubmitting(true);
            const sitemapUrl = `${window.location.origin}/sitemap.xml`;

            // Note: This is a placeholder for the actual Google Search Console API call
            // In production, this should be handled by your backend
            setFlashMessage({
                type: 'info',
                message: `Sitemap submission to Google initiated for: ${sitemapUrl}. Please configure backend API integration.`
            });

            // TODO: Implement backend API call to submit sitemap to Google Search Console
            // Example endpoint: POST /api/seo/submit-sitemap
            // with payload: { sitemapUrl, apiKey: settings.google_search_console_api_key }

        } catch (error) {
            console.error('Error submitting sitemap to Google:', error);
            setFlashMessage({ type: 'error', message: 'Failed to submit sitemap to Google' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (!store?.id) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            // Package settings into JSON structure
            const xmlSitemapSettings = {
                enabled: settings.enable_sitemap ?? true,
                include_products: settings.sitemap_include_products,
                include_categories: settings.sitemap_include_categories,
                include_pages: settings.sitemap_include_pages,
                include_images: settings.sitemap_include_images,
                include_videos: settings.sitemap_include_videos,
                enable_news: settings.sitemap_enable_news,
                enable_index: settings.sitemap_enable_index,
                max_urls: settings.sitemap_max_urls,
                google_search_console_api_key: settings.google_search_console_api_key,
                auto_submit: settings.sitemap_auto_submit
            };

            const payload = {
                store_id: store.id,
                xml_sitemap_settings: xmlSitemapSettings
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

            // Auto-submit if enabled
            if (settings.sitemap_auto_submit) {
                await submitToGoogle();
            }

            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving sitemap settings:', error);
            setFlashMessage({ type: 'error', message: 'Failed to save sitemap settings' });
        } finally {
            setSaving(false);
        }
    };

    const downloadSitemap = (xml, filename = 'sitemap.xml') => {
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
            <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

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

                    {/* Additional stats for Google features */}
                    {(settings.sitemap_include_images || settings.sitemap_include_videos || settings.sitemap_enable_news) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {settings.sitemap_include_images && (
                                <div className="bg-pink-50 dark:bg-pink-950 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.images}</div>
                                    <div className="text-sm text-muted-foreground">Images</div>
                                </div>
                            )}
                            {settings.sitemap_include_videos && (
                                <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.videos}</div>
                                    <div className="text-sm text-muted-foreground">Videos</div>
                                </div>
                            )}
                            {settings.sitemap_enable_news && (
                                <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.newsArticles}</div>
                                    <div className="text-sm text-muted-foreground">News Articles</div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabbed Settings */}
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                    <TabsTrigger value="google">Google Features</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* Basic Settings Tab */}
                <TabsContent value="basic">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Sitemap Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Configure what content types should be included in your XML sitemap.
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
                </TabsContent>

                {/* Google Features Tab */}
                <TabsContent value="google">
                    <Card>
                        <CardHeader>
                            <CardTitle>Google-Specific Features</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Enable advanced Google features like image sitemaps, video sitemaps, and Google News support.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 flex items-center gap-2">
                                        <Image className="h-5 w-5 text-pink-600" />
                                        <div>
                                            <Label htmlFor="include-images">Image Sitemap</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Include product and page images with image tags
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="include-images"
                                        checked={settings.sitemap_include_images}
                                        onCheckedChange={(checked) => {
                                            setSettings({ ...settings, sitemap_include_images: checked });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 flex items-center gap-2">
                                        <Video className="h-5 w-5 text-indigo-600" />
                                        <div>
                                            <Label htmlFor="include-videos">Video Sitemap</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Include product demonstration and page videos
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="include-videos"
                                        checked={settings.sitemap_include_videos}
                                        onCheckedChange={(checked) => {
                                            setSettings({ ...settings, sitemap_include_videos: checked });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 flex items-center gap-2">
                                        <Newspaper className="h-5 w-5 text-yellow-600" />
                                        <div>
                                            <Label htmlFor="enable-news">Google News Sitemap</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Generate Google News sitemap for recent articles (last 2 days)
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="enable-news"
                                        checked={settings.sitemap_enable_news}
                                        onCheckedChange={(checked) => {
                                            setSettings({ ...settings, sitemap_enable_news: checked });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 flex items-center gap-2">
                                        <Upload className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <Label htmlFor="auto-submit">Auto-Submit to Google</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically notify Google when sitemap is updated
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="auto-submit"
                                        checked={settings.sitemap_auto_submit}
                                        onCheckedChange={(checked) => {
                                            setSettings({ ...settings, sitemap_auto_submit: checked });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="gsc-api-key">Google Search Console API Key</Label>
                                    <Input
                                        id="gsc-api-key"
                                        type="password"
                                        placeholder="Enter your Google Search Console API key"
                                        value={settings.google_search_console_api_key}
                                        onChange={(e) => setSettings({ ...settings, google_search_console_api_key: e.target.value })}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Required for auto-submission feature. Get your API key from Google Search Console.
                                    </p>
                                </div>

                                <Button
                                    onClick={submitToGoogle}
                                    disabled={submitting || !settings.google_search_console_api_key}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Upload className={`mr-2 h-4 w-4 ${submitting ? 'animate-bounce' : ''}`} />
                                    {submitting ? 'Submitting to Google...' : 'Submit to Google Now'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <FileStack className="h-4 w-4" />
                                <AlertDescription>
                                    Configure sitemap index and splitting for large sites.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="enable-index">Enable Sitemap Index</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Generate a sitemap index file for multiple sitemaps
                                        </p>
                                    </div>
                                    <Switch
                                        id="enable-index"
                                        checked={settings.sitemap_enable_index}
                                        onCheckedChange={(checked) => {
                                            setSettings({ ...settings, sitemap_enable_index: checked });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max-urls">Maximum URLs Per Sitemap</Label>
                                    <Input
                                        id="max-urls"
                                        type="number"
                                        min="100"
                                        max="50000"
                                        value={settings.sitemap_max_urls}
                                        onChange={(e) => setSettings({ ...settings, sitemap_max_urls: parseInt(e.target.value) || 50000 })}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Google recommends max 50,000 URLs per sitemap. Split into multiple files if exceeded.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    onClick={generateSitemap}
                    disabled={generating}
                    variant="outline"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Regenerating...' : 'Regenerate Sitemap'}
                </Button>
                <Button
                    onClick={() => downloadSitemap(sitemapXml, 'sitemap.xml')}
                    disabled={!sitemapXml || generating}
                    variant="outline"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Standard
                </Button>
                {settings.sitemap_include_images && imageSitemapXml && (
                    <Button
                        onClick={() => downloadSitemap(imageSitemapXml, 'sitemap-images.xml')}
                        disabled={generating}
                        variant="outline"
                    >
                        <Image className="mr-2 h-4 w-4" />
                        Download Images
                    </Button>
                )}
                {settings.sitemap_include_videos && videoSitemapXml && (
                    <Button
                        onClick={() => downloadSitemap(videoSitemapXml, 'sitemap-videos.xml')}
                        disabled={generating}
                        variant="outline"
                    >
                        <Video className="mr-2 h-4 w-4" />
                        Download Videos
                    </Button>
                )}
                {settings.sitemap_enable_news && newsSitemapXml && (
                    <Button
                        onClick={() => downloadSitemap(newsSitemapXml, 'sitemap-news.xml')}
                        disabled={generating}
                        variant="outline"
                    >
                        <Newspaper className="mr-2 h-4 w-4" />
                        Download News
                    </Button>
                )}
                {settings.sitemap_enable_index && sitemapIndexXml && (
                    <Button
                        onClick={() => downloadSitemap(sitemapIndexXml, 'sitemap-index.xml')}
                        disabled={generating}
                        variant="outline"
                    >
                        <FileStack className="mr-2 h-4 w-4" />
                        Download Index
                    </Button>
                )}
            </div>

            {/* Preview Tabs */}
            <Tabs defaultValue="standard" className="w-full">
                <TabsList>
                    <TabsTrigger value="standard">Standard Sitemap</TabsTrigger>
                    {settings.sitemap_include_images && <TabsTrigger value="images">Images</TabsTrigger>}
                    {settings.sitemap_include_videos && <TabsTrigger value="videos">Videos</TabsTrigger>}
                    {settings.sitemap_enable_news && <TabsTrigger value="news">News</TabsTrigger>}
                    {settings.sitemap_enable_index && <TabsTrigger value="index">Index</TabsTrigger>}
                </TabsList>

                <TabsContent value="standard">
                    <Card>
                        <CardHeader>
                            <CardTitle>Standard Sitemap Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                                <pre className="text-xs">
                                    {sitemapXml || 'Generating sitemap...'}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {settings.sitemap_include_images && (
                    <TabsContent value="images">
                        <Card>
                            <CardHeader>
                                <CardTitle>Image Sitemap Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                                    <pre className="text-xs">
                                        {imageSitemapXml || 'No image sitemap generated'}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {settings.sitemap_include_videos && (
                    <TabsContent value="videos">
                        <Card>
                            <CardHeader>
                                <CardTitle>Video Sitemap Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                                    <pre className="text-xs">
                                        {videoSitemapXml || 'No video sitemap generated'}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {settings.sitemap_enable_news && (
                    <TabsContent value="news">
                        <Card>
                            <CardHeader>
                                <CardTitle>Google News Sitemap Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                                    <pre className="text-xs">
                                        {newsSitemapXml || 'No news sitemap generated'}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {settings.sitemap_enable_index && (
                    <TabsContent value="index">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sitemap Index Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                                    <pre className="text-xs">
                                        {sitemapIndexXml || 'No sitemap index generated'}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

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
