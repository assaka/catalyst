import React, { useState, useEffect, useCallback } from 'react';
import { SeoSetting } from '@/api/entities';
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Bot, RefreshCw } from 'lucide-react';

export default function RobotsTxt() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [robotsTxt, setRobotsTxt] = useState('');
    const [seoSetting, setSeoSetting] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (!selectedStore) {
                setLoading(false);
                return;
            }
            setStore(selectedStore);
            const settings = await SeoSetting.filter({ store_id: selectedStore.id });
            if (settings && settings.length > 0) {
                setSeoSetting(settings[0]);
                setRobotsTxt(settings[0].robots_txt_content || '');
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedStore]);

    useEffect(() => {
        if (selectedStore) {
            loadData();
        }
    }, [selectedStore, loadData]);

    const generateRobotsTxt = async () => {
        setGenerating(true);
        try {
            const storeId = getSelectedStoreId();
            if (!storeId) return;

            const [products, categories, pages] = await Promise.all([
                Product.filter({ store_id: storeId, "seo.meta_robots_tag": "noindex, nofollow" }),
                Category.filter({ store_id: storeId, meta_robots_tag: "noindex, nofollow" }),
                CmsPage.filter({ store_id: storeId, meta_robots_tag: "noindex, nofollow" })
            ]);

            const defaultRules = [
                'User-agent: *',
                'Allow: /',
                'Disallow: /admin/',
                'Disallow: /checkout/',
                'Disallow: /cart/',
                'Disallow: /account/',
                'Disallow: /login',
                `Sitemap: ${selectedStore.custom_domain || selectedStore.domain}/sitemap.xml`
            ].join('\n');

            let newContent = [defaultRules];

            if (products.length > 0) {
                newContent.push('\n# Disallowed Products');
                products.forEach(p => newContent.push(`Disallow: /products/${p.slug || p.id}`));
            }
            if (categories.length > 0) {
                newContent.push('\n# Disallowed Categories');
                categories.forEach(c => newContent.push(`Disallow: /categories/${c.slug}`));
            }
            if (pages.length > 0) {
                newContent.push('\n# Disallowed CMS Pages');
                pages.forEach(p => newContent.push(`Disallow: /pages/${p.slug}`));
            }

            setRobotsTxt(newContent.join('\n'));
        } catch (error) {
            console.error("Error generating robots.txt content:", error);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const storeId = getSelectedStoreId();
            if (seoSetting) {
                await SeoSetting.update(seoSetting.id, { robots_txt_content: robotsTxt });
            } else if (storeId) {
                await SeoSetting.create({ store_id: storeId, robots_txt_content: robotsTxt });
            }
            // Optionally, show a success message
        } catch (error) {
            console.error("Error saving robots.txt:", error);
            // Optionally, show an error message
        } finally {
            setSaving(false);
        }
    };
    
    // This allows the robots.txt content to be served correctly
    if (loading) {
      return <div>Loading...</div>; // Or a blank screen
    }

    // For serving the actual robots.txt file
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('raw') === 'true') {
        return <pre>{robotsTxt}</pre>;
    }

    // For the admin editor view
    return (
        <div className="max-w-4xl mx-auto p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Bot className="w-8 h-8 text-gray-700" />
                        <div>
                            <CardTitle>robots.txt Editor</CardTitle>
                            <CardDescription>Manage search engine access to your site.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={robotsTxt}
                        onChange={(e) => setRobotsTxt(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="User-agent: * ..."
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={generateRobotsTxt} 
                            disabled={generating || !selectedStore}
                        >
                            {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            Update with Product Rules
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Save className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}