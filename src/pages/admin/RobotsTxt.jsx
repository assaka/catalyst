import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SeoSetting } from '@/api/entities';
import { Product } from '@/api/entities';
import { Category } from '@/api/entities';
import { CmsPage } from '@/api/entities';
import { Store } from '@/api/entities';
import { User } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { clearCache } from "@/components/storefront/StoreProvider";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, RefreshCw } from 'lucide-react';
import SaveButton from '@/components/ui/save-button';

export default function RobotsTxt() {
    const { selectedStore, getSelectedStoreId } = useStoreSelection();
    const [robotsTxt, setRobotsTxt] = useState('');
    const [seoSetting, setSeoSetting] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
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
        setSaveSuccess(false);
        try {
            const storeId = getSelectedStoreId();
            if (seoSetting) {
                await SeoSetting.update(seoSetting.id, { robots_txt_content: robotsTxt });
            } else if (storeId) {
                await SeoSetting.create({ store_id: storeId, robots_txt_content: robotsTxt });
            }
            
            // Clear SEO cache to ensure changes are reflected immediately
            if (typeof window !== 'undefined' && window.clearCache) {
              window.clearCache();
            }
            localStorage.setItem('forceRefreshStore', 'true');

            // Success state for button feedback
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
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
        // Set proper content type for robots.txt
        useEffect(() => {
            document.title = 'robots.txt';
            // Remove any existing meta tags that might interfere
            const existingMeta = document.querySelector('meta[name="robots"]');
            if (existingMeta) {
                existingMeta.remove();
            }
        }, []);
        
        return (
            <div style={{ 
                margin: 0, 
                padding: 0, 
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.2',
                whiteSpace: 'pre-wrap',
                backgroundColor: 'white',
                color: 'black'
            }}>
                {robotsTxt || 'User-agent: *\nAllow: /'}
            </div>
        );
    }

    // For the admin editor view
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <Card className="shadow-lg">
                    <CardHeader className="border-b bg-white">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 flex-shrink-0" />
                            <div className="flex-1">
                                <CardTitle className="text-xl sm:text-2xl">robots.txt Editor</CardTitle>
                                <CardDescription className="text-sm sm:text-base mt-1">
                                    Manage search engine access to your site
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {/* Info section with basic format */}
                        <div className="mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-sm sm:text-base text-blue-900 mb-2">Basic Format:</h3>
                            <pre className="text-xs sm:text-sm text-blue-800 overflow-x-auto whitespace-pre-wrap">
{`User-agent: *              # Applies to all search engines
Allow: /                   # Allow crawling of all pages
Disallow: /admin/          # Block admin pages
Disallow: /private/        # Block private pages
Disallow: /checkout/       # Block checkout process
Disallow: /cart/           # Block cart pages
Crawl-delay: 1            # Wait 1 second between requests
Sitemap: /sitemap.xml     # Location of sitemap`}
                            </pre>
                        </div>
                        
                        {/* Editor */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Edit robots.txt content:
                                </label>
                                <Textarea
                                    value={robotsTxt}
                                    onChange={(e) => setRobotsTxt(e.target.value)}
                                    rows={15}
                                    className="font-mono text-xs sm:text-sm w-full resize-none"
                                    placeholder="User-agent: *\nAllow: /\nDisallow: /admin/\n..."
                                />
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                                <Button 
                                    variant="outline" 
                                    onClick={generateRobotsTxt} 
                                    disabled={generating || !selectedStore}
                                    className="w-full sm:w-auto"
                                >
                                    {generating ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="text-sm sm:text-base">Update with Product Rules</span>
                                </Button>
                                <SaveButton
                                    onClick={handleSave}
                                    loading={saving}
                                    success={saveSuccess}
                                    defaultText="Save Changes"
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        </div>
                        
                        {/* Help text */}
                        <div className="mt-6 text-xs sm:text-sm text-gray-600">
                            <p className="mb-2">💡 Tips:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Use "Disallow:" to block pages from search engines</li>
                                <li>Use "Allow:" to explicitly allow pages</li>
                                <li>"Crawl-delay" helps prevent server overload</li>
                                <li>Always include your sitemap URL</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}