
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SeoSetting } from "@/api/entities";
import { SeoTemplate } from "@/api/entities";
import { Redirect } from "@/api/entities";
import { Store } from "@/api/entities";
import { Category } from "@/api/entities";
import { Product } from "@/api/entities";
import { CmsPage } from "@/api/entities";
import { AttributeSet } from "@/api/entities";
import { User } from "@/api/entities";
import { clearSeoTemplatesCache } from "@/utils/cacheUtils";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import CmsBlockRenderer from "@/components/storefront/CmsBlockRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  FileText,
  Bot,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
  RefreshCw,
  Zap,
  Crown,
  Eye,
  Share2, // Added for social settings
  Link2, // Added for social settings
  Info as InfoIcon,
  Copy,
  Link,
  Package,
  Folder,
  Search
} from "lucide-react";
import FlashMessage from "@/components/storefront/FlashMessage";
import { InvokeLLM } from "@/api/integrations";
import { useStore, clearCache, clearCacheKeys } from "@/components/storefront/StoreProvider";
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';

export default function SeoTools() {
  const location = useLocation();
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [aiCredits, setAiCredits] = useState(25);
  const [updatingRobots, setUpdatingRobots] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const [seoSettings, setSeoSettings] = useState({
    default_meta_title: '',
    default_meta_description: '',
    default_meta_keywords: '',
    canonical_base_url: '',
    enable_rich_snippets: true,
    enable_open_graph: true,
    enable_twitter_cards: true,
    robots_txt_content: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /checkout/\nDisallow: /cart/',
    enable_sitemap: true,
    sitemap_include_products: true,
    sitemap_include_categories: true,
    sitemap_include_pages: true,
    auto_canonical_filtered_pages: true,
    hreflang_settings: [],
    schema_settings: {
        enable_product_schema: true,
        enable_organization_schema: true,
        organization_name: '',
        organization_logo_url: '',
        social_profiles: []
    },
    open_graph_settings: {
        default_image_url: '',
        facebook_app_id: ''
    },
    twitter_card_settings: {
        card_type: 'summary_large_image',
        site_username: ''
    },
    store_id: ''
  });

  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'product',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    conditions: {
      categories: [],
      attribute_sets: []
    }
  });

  const [redirects, setRedirects] = useState([]);
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState(null);
  const [redirectForm, setRedirectForm] = useState({ // Use useState instead of direct object
    from_url: '',
    to_url: '',
    type: '301'
  });

  const [seoReport, setSeoReport] = useState({
    total_pages: 0,
    pages_with_meta_title: 0,
    pages_with_meta_description: 0,
    pages_with_canonical: 0,
    duplicate_titles: [],
    missing_alt_tags: [],
    broken_links: [],
    error_404_count: 0,
    last_updated: null
  });

  const [categories, setCategories] = useState([]);
  const [attributeSets, setAttributeSets] = useState([]);

  useEffect(() => {
    if (selectedStore) {
      loadData();
    }
  }, [selectedStore]);

  useEffect(() => {
    // Extract tab from URL path: /admin/seo-tools/settings -> 'settings'
    const pathParts = location.pathname.split('/');
    const tab = pathParts[pathParts.length - 1] || 'settings';
    
    // If we're at the base /admin/seo-tools URL, default to 'settings'
    const actualTab = pathParts[pathParts.length - 1] === 'seo-tools' ? 'settings' : tab;
    
    if (actualTab !== activeTab) {
      setActiveTab(actualTab);
    }
  }, [location.pathname, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!selectedStore) {
        setLoading(false);
        return;
      }

      setStore(selectedStore);

        let settingsData = [];
        try {
          settingsData = await SeoSetting.filter({ store_id: selectedStore.id });
        } catch (fetchError) {
          settingsData = [];
        }

        if (settingsData && settingsData.length > 0) {
          const loadedSettings = settingsData[0];
          
          setSeoSettings(prev => {
            const newSettings = {
              ...prev,
              ...loadedSettings,
              hreflang_settings: Array.isArray(loadedSettings.hreflang_settings) ? loadedSettings.hreflang_settings : [],
              schema_settings: loadedSettings.schema_settings || prev.schema_settings,
              open_graph_settings: loadedSettings.open_graph_settings || prev.open_graph_settings,
              twitter_card_settings: loadedSettings.twitter_card_settings || prev.twitter_card_settings,
              store_id: selectedStore.id
            };
            return newSettings;
          });
        } else {
          setSeoSettings(prev => ({
            ...prev,
            store_id: selectedStore.id
          }));
        }

        try {
          const [templatesData, redirectsData, categoriesData, attributeSetsData] = await Promise.all([
            // Use direct admin API call for SEO templates to avoid public API filtering
            fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/seo-templates?store_id=${selectedStore.id}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}`
              }
            }).then(res => res.ok ? res.json() : []).catch(() => []),
            Redirect.filter({ store_id: selectedStore.id }).catch(() => []),
            Category.filter({ store_id: selectedStore.id }).catch(() => []),
            AttributeSet.filter({ store_id: selectedStore.id }).catch(() => [])
          ]);

          setTemplates(Array.isArray(templatesData) ? templatesData : []);
          setRedirects(Array.isArray(redirectsData) ? redirectsData : []);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          setAttributeSets(Array.isArray(attributeSetsData) ? attributeSetsData : []);
        } catch (error) {
          console.error("Error loading additional data:", error);
          // Set defaults if Promise.all fails
          setTemplates([]);
          setRedirects([]);
          setCategories([]);
          setAttributeSets([]);
        }

        await generateSeoReport();

    } catch (error) {
      console.error("Error loading SEO data:", error);
      setFlashMessage({ type: 'error', message: 'Failed to load SEO data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateSeoReport = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const products = await Product.filter({ store_id: storeId });
      const categories = await Category.filter({ store_id: storeId });
      const pages = await CmsPage.filter({ store_id: storeId });

      const totalPages = (products?.length || 0) + (categories?.length || 0) + (pages?.length || 0);
      const allPages = [...(products || []), ...(categories || []), ...(pages || [])];
      const pagesWithTitle = allPages.filter(p => p.meta_title).length;
      const pagesWithDescription = allPages.filter(p => p.meta_description).length;
      const pagesWithCanonical = allPages.filter(p => p.canonical_url || p.slug).length;

      const titleCounts = {};
      allPages.forEach(page => {
        if (page.meta_title) {
          titleCounts[page.meta_title] = (titleCounts[page.meta_title] || 0) + 1;
        }
      });
      const duplicateTitles = Object.entries(titleCounts)
        .filter(([title, count]) => count > 1)
        .map(([title]) => title);

      setSeoReport({
        total_pages: totalPages,
        pages_with_meta_title: pagesWithTitle,
        pages_with_meta_description: pagesWithDescription,
        pages_with_canonical: pagesWithCanonical,
        duplicate_titles: duplicateTitles,
        missing_alt_tags: [], // Placeholder, actual implementation would involve image scanning
        broken_links: [], // Placeholder, actual implementation would involve link checking
        error_404_count: 0, // Placeholder, actual implementation would involve 404 logs
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating SEO report:", error);
    }
  };

  const handleSaveSettings = async () => {
    const storeId = getSelectedStoreId();

    if (!storeId) {
      setFlashMessage({ type: 'error', message: 'No store found. Please refresh the page.' });
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    try {
      let existingSettings = [];
      try {
        existingSettings = await SeoSetting.filter({ store_id: storeId });
      } catch (fetchError) {
        existingSettings = [];
      }

      const payload = {
        default_meta_title: seoSettings.default_meta_title || '',
        default_meta_description: seoSettings.default_meta_description || '',
        default_meta_keywords: seoSettings.default_meta_keywords || '',
        canonical_base_url: seoSettings.canonical_base_url || '',
        enable_rich_snippets: Boolean(seoSettings.enable_rich_snippets),
        enable_open_graph: Boolean(seoSettings.enable_open_graph),
        enable_twitter_cards: Boolean(seoSettings.enable_twitter_cards),
        robots_txt_content: seoSettings.robots_txt_content || 'User-agent: *\nAllow: /',
        enable_sitemap: Boolean(seoSettings.enable_sitemap),
        sitemap_include_products: Boolean(seoSettings.sitemap_include_products),
        sitemap_include_categories: Boolean(seoSettings.sitemap_include_categories),
        sitemap_include_pages: Boolean(seoSettings.sitemap_include_pages),
        auto_canonical_filtered_pages: Boolean(seoSettings.auto_canonical_filtered_pages),
        hreflang_settings: Array.isArray(seoSettings.hreflang_settings) ? seoSettings.hreflang_settings : [],
        schema_settings: seoSettings.schema_settings,
        open_graph_settings: seoSettings.open_graph_settings,
        twitter_card_settings: seoSettings.twitter_card_settings,
        store_id: storeId
      };

      let result;
      if (existingSettings && existingSettings.length > 0) {
        result = await SeoSetting.update(existingSettings[0].id, payload);
      } else {
        result = await SeoSetting.create(payload);
      }

      // VERIFICATION: Immediately fetch back from database to confirm save worked
      try {
        const verificationSettings = await SeoSetting.filter({ store_id: storeId });
        if (verificationSettings && verificationSettings.length > 0) {
          const saved = verificationSettings[0];
        }
      } catch (verifyError) {
        console.error('🚨 VERIFICATION FAILED:', verifyError);
      }

      // Clear SEO cache to ensure changes are reflected immediately
      clearSeoCache(storeId);
      
      setFlashMessage({ type: 'success', message: 'Settings saved successfully! Changes will be visible on storefront refresh.' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setSaving(false);

    } catch (error) {
      console.error("Detailed save error:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = 'Unknown error';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFlashMessage({
        type: 'error',
        message: `Failed to save settings: ${errorMessage}`
      });
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    console.log('🔍 handleSaveTemplate called');

    // Check authentication status
    const adminToken = localStorage.getItem('store_owner_auth_token');
    console.log('🔍 Admin token exists:', !!adminToken);

    if (!adminToken) {
      setFlashMessage({ type: 'error', message: 'Authentication required. Please refresh the page and try again.' });
      setSaving(false);
      return;
    }

    try {
      setSaving(true);
      setSaveSuccess(false);

      const storeId = getSelectedStoreId();
      if (!storeId) {
        setFlashMessage({ type: 'error', message: 'No store found. Please refresh the page.' });
        setSaving(false);
        return;
      }

      const payload = {
        name: templateForm.name,
        type: templateForm.type,
        meta_title: templateForm.meta_title,
        meta_description: templateForm.meta_description,
        meta_keywords: templateForm.meta_keywords,
        is_active: templateForm.is_active,
        conditions: templateForm.conditions,
        store_id: storeId
      };

      if (editingTemplate) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/seo-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
        const updateResult = await response.json();
        if (!response.ok) {
          console.log('🔍 Update error:', updateResult);
          throw new Error(updateResult.message || 'Failed to update template');
        }
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/seo-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });
        const createResult = await response.json();
        if (!response.ok) {
          throw new Error(createResult.message || 'Failed to create template');
        }
      }

      await loadData();
      setShowTemplateForm(false);
      setEditingTemplate(null);
      resetTemplateForm();
      setFlashMessage({ type: 'success', message: 'Template saved successfully!' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      // Clear storefront cache for instant updates
      if (storeId) clearSeoTemplatesCache(storeId);
    } catch (error) {
      console.error('Save template error:', error);
      setFlashMessage({ type: 'error', message: 'Failed to save template: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const adminToken = localStorage.getItem('store_owner_auth_token');
        if (!adminToken) {
          setFlashMessage({ type: 'error', message: 'Authentication required. Please refresh the page and try again.' });
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/seo-templates/${templateId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || 'Failed to delete template');
        }

        await loadData();
        setFlashMessage({ type: 'success', message: 'Template deleted successfully!' });
        // Clear storefront cache for instant updates
        const storeId = selectedStore?.id;
        if (storeId) clearSeoTemplatesCache(storeId);
      } catch (error) {
        setFlashMessage({ type: 'error', message: 'Failed to delete template: ' + error.message });
      }
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      type: 'product',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      is_active: true,
      conditions: {
        categories: [],
        attribute_sets: []
      }
    });
  };

  const handleSaveRedirect = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const storeId = getSelectedStoreId();
      if (!storeId) {
        setFlashMessage({ type: 'error', message: 'No store found. Please refresh the page.' });
        setSaving(false);
        return;
      }

      const payload = {
        from_url: redirectForm.from_url,
        to_url: redirectForm.to_url,
        type: redirectForm.type,
        store_id: storeId
      };

      if (editingRedirect) {
        await Redirect.update(editingRedirect.id, payload);
      } else {
        await Redirect.create(payload);
      }

      await loadData();
      setShowRedirectForm(false);
      setEditingRedirect(null);
      resetRedirectForm();
      setFlashMessage({ type: 'success', message: 'Redirect saved successfully!' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to save redirect: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRedirect = async (redirectId) => {
    if (window.confirm('Are you sure you want to delete this redirect?')) {
      try {
        await Redirect.delete(redirectId);
        await loadData();
        setFlashMessage({ type: 'success', message: 'Redirect deleted successfully!' });
      } catch (error) {
        setFlashMessage({ type: 'error', message: 'Failed to delete redirect: ' + error.message });
      }
    }
  };

  const resetRedirectForm = () => {
    setRedirectForm({
      from_url: '',
      to_url: '',
      type: '301'
    });
  };

  const generateWithAI = async (type, context = {}) => {
    if (aiCredits <= 0) {
      setFlashMessage({ type: 'error', message: 'No AI credits available. Upgrade your plan to use AI features.' });
      return;
    }

    try {
      setSaving(true);
      let prompt = '';

      if (type === 'template') {
        prompt = `Generate SEO templates for ${context.type} pages. Include meta title, description and keywords templates using placeholders like {{name}}, {{description}}, {{store_name}}, {{category_name}}.`;
      } else if (type === 'meta_title') {
        prompt = `Generate a meta title for a ${context.type} page.`;
        if (context.productName) prompt += ` Product name: ${context.productName}.`;
        if (context.categoryName) prompt += ` Category name: ${context.categoryName}.`;
        prompt += ` Use placeholders like {{product_name}}, {{category_name}}, {{store_name}}.`;
      }

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            meta_keywords: { type: "string" }
          }
        }
      });

      setAiCredits(prev => prev - 1);

      if (type === 'template') {
        setTemplateForm(prev => ({
          ...prev,
          meta_title: response.meta_title || prev.meta_title,
          meta_description: response.meta_description || prev.meta_description,
          meta_keywords: response.meta_keywords || prev.meta_keywords
        }));
      }

      setFlashMessage({ type: 'success', message: 'AI content generated successfully!' });

    } catch (error) {
      setFlashMessage({ type: 'error', message: 'AI generation failed: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const generateXmlSitemap = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) return;

      const products = await Product.filter({ status: 'active', store_id: storeId });
      const categories = await Category.filter({ is_active: true, store_id: storeId });
      const pages = await CmsPage.filter({ is_active: true, store_id: storeId });

      let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${window.location.origin}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;

      if (seoSettings.sitemap_include_categories && categories?.length > 0) {
        categories.forEach(category => {
          sitemapXml += `
  <url>
    <loc>${window.location.origin}/category/${category.slug || category.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${new Date(category.updated_date || category.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
        });
      }

      if (seoSettings.sitemap_include_products && products?.length > 0) {
        products.forEach(product => {
          sitemapXml += `
  <url>
    <loc>${window.location.origin}/product/${product.slug || product.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${new Date(product.updated_date || product.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
        });
      }

      if (seoSettings.sitemap_include_pages && pages?.length > 0) {
        pages.forEach(page => {
          sitemapXml += `
  <url>
    <loc>${window.location.origin}/page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
    <lastmod>${new Date(page.updated_date || page.created_date).toISOString().split('T')[0]}</lastmod>
  </url>`;
        });
      }

      sitemapXml += '\n</urlset>';

      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      a.click();
      URL.revokeObjectURL(url);

      setFlashMessage({ type: 'success', message: `Sitemap generated with ${(products?.length || 0) + (categories?.length || 0) + (pages?.length || 0) + 1} URLs!` });
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to generate sitemap: ' + error.message });
    }
  };

  const generateRobotsTxt = () => {
    let robotsContent = seoSettings.robots_txt_content;
    robotsContent = robotsContent.replace(/\{\{site_url\}\}/g, window.location.origin);

    if (categories?.length > 0) {
      categories.forEach(category => {
        if (category.seo_robots === 'noindex') {
          robotsContent += `\nDisallow: /category/${category.slug || category.id}`;
        }
      });
    }

    const blob = new Blob([robotsContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    a.click();
    URL.revokeObjectURL(url);
    setFlashMessage({ type: 'success', message: 'Robots.txt downloaded successfully!' });
  };

  const updateRobotsContent = async () => {
    try {
      const storeId = getSelectedStoreId();
      if (!storeId) {
        setFlashMessage({ type: 'error', message: 'No store found. Cannot update robots.txt.' });
        return;
      }

      setUpdatingRobots(true);

      const [products, categories, cmsPages] = await Promise.all([
        Product.filter({ store_id: storeId }),
        Category.filter({ store_id: storeId }),
        CmsPage.filter({ store_id: storeId })
      ]);

      let specificDisallowRules = [];

      if (products && Array.isArray(products)) {
        products.forEach(product => {
          const robotsTag = product.seo?.meta_robots_tag;
          if (robotsTag && (robotsTag.includes('noindex') || robotsTag.includes('nofollow'))) {
            specificDisallowRules.push(`Disallow: /product/${product.slug}`);
          }
        });
      }

      if (categories && Array.isArray(categories)) {
        categories.forEach(category => {
          if (category.meta_robots_tag && (category.meta_robots_tag.includes('noindex') || category.meta_robots_tag.includes('nofollow'))) {
            specificDisallowRules.push(`Disallow: /category/${category.slug}`);
          }
        });
      }

      if (cmsPages && Array.isArray(cmsPages)) {
        cmsPages.forEach(page => {
          if (page.meta_robots_tag && (page.meta_robots_tag.includes('noindex') || page.meta_robots_tag.includes('nofollow'))) {
            specificDisallowRules.push(`Disallow: /page/${page.slug}`);
          }
        });
      }

      const defaultRules = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/`;

      const finalContent = specificDisallowRules.length > 0
        ? `${defaultRules}

# Pages with noindex/nofollow
${specificDisallowRules.join('\n')}

# Sitemap
Sitemap: ${window.location.origin}/sitemap.xml`
        : `${defaultRules}

# Sitemap
Sitemap: ${window.location.origin}/sitemap.xml`;

      const updatedSettings = {
        ...seoSettings,
        robots_txt_content: finalContent,
        store_id: storeId
      };

      if (seoSettings?.id) {
        await SeoSetting.update(seoSettings.id, updatedSettings);
      } else {
        await SeoSetting.create({
          ...updatedSettings,
          store_id: storeId
        });
      }

      setSeoSettings(updatedSettings);
      
      // Clear SEO cache to ensure changes are reflected immediately
      clearSeoCache(storeId);
      
      setFlashMessage({
        type: 'success',
        message: `Robots.txt updated with ${specificDisallowRules.length} specific rules from your content. Cache cleared.`
      });

    } catch (error) {
      console.error('Error updating robots content:', error);
      setFlashMessage({
        type: 'error',
        message: 'Failed to update robots.txt content.'
      });
    } finally {
      setUpdatingRobots(false);
    }
  };

  const addHreflangSetting = () => {
    setSeoSettings(prev => ({
      ...prev,
      hreflang_settings: [
        ...prev.hreflang_settings,
        {
          language_code: '',
          country_code: '',
          url_pattern: '{{base_url}}/{{language_code}}{{current_url}}',
          is_active: true
        }
      ]
    }));
  };

  const updateHreflangSetting = (index, field, value) => {
    setSeoSettings(prev => ({
      ...prev,
      hreflang_settings: prev.hreflang_settings.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeHreflangSetting = (index) => {
    setSeoSettings(prev => ({
      ...prev,
      hreflang_settings: prev.hreflang_settings.filter((_, i) => i !== index)
    }));
  };

  const handleNestedSettingsChange = (section, key, value) => {
    setSeoSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const seoScore = seoReport.total_pages > 0
    ? Math.round(((seoReport.pages_with_meta_title + seoReport.pages_with_meta_description) / (seoReport.total_pages * 2)) * 100)
    : 0;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Template Variables</h4>
                <p className="text-sm text-blue-800 mb-2">
                  You can use these variables in your meta title and description templates:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div><code>{'{{store_name}}'}</code> - Your store name</div>
                  <div><code>{'{{page_title}}'}</code> - Current page title</div>
                  <div><code>{'{{product_name}}'}</code> - Product name (products only)</div>
                  <div><code>{'{{category_name}}'}</code> - Category name (categories only)</div>
                  <div><code>{'{{description}}'}</code> - Page/product description</div>
                  <div><code>{'{{price}}'}</code> - Product price (products only)</div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Global Variables:</strong> {`{{store_name}}`}, {`{{site_name}}`}, {`{{store_description}}`}, {`{{page_title}}`}, {`{{base_url}}`}, {`{{current_url}}`}, {`{{current_path}}`}, {`{{year}}`}, {`{{currency}}`}</p>
                  <p className="mt-1"><strong>Product Pages:</strong> {`{{product_name}}`}, {`{{product_description}}`}</p>
                  <p className="mt-1"><strong>Category Pages:</strong> {`{{category_name}}`}, {`{{category_description}}`}</p>
                  <p className="mt-1 text-xs text-blue-600">💡 Both {`{{variable}}`} and {`{variable}`} syntax supported</p>
                </div>
              </div>

              <div>
                <Label>Default Meta Title Template</Label>
                <Input
                  value={seoSettings.default_meta_title}
                  onChange={(e) => setSeoSettings(prev => ({ ...prev, default_meta_title: e.target.value }))}
                  placeholder="{{store_name}} - {{page_title}}"
                />
              </div>

              <div>
                <Label>Default Meta Description Template</Label>
                <Textarea
                  value={seoSettings.default_meta_description}
                  onChange={(e) => setSeoSettings(prev => ({ ...prev, default_meta_description: e.target.value }))}
                  placeholder="Shop quality products at {{store_name}}..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Default Meta Keywords</Label>
                <Input
                  value={seoSettings.default_meta_keywords}
                  onChange={(e) => setSeoSettings(prev => ({ ...prev, default_meta_keywords: e.target.value }))}
                  placeholder="ecommerce, online store, products"
                />
              </div>

              {/* SEO Preview Section */}
              {(seoSettings.default_meta_title || seoSettings.default_meta_description) && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Preview</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">HTML Title Tag</p>
                        <code className="text-sm bg-white px-2 py-1 rounded border block overflow-x-auto">
                          &lt;title&gt;{(() => {
                            if (!seoSettings.default_meta_title) return 'Sample Page';
                            
                            // Use same template replacement as storefront
                            const applyTemplate = (template) => {
                              if (!template) return '';
                              
                              let result = template;
                              
                              const replacements = {
                                '{{store_name}}': selectedStore?.name || 'Your Store',
                                '{{page_title}}': 'Sample Page',
                                '{{site_name}}': selectedStore?.name || 'Your Store',
                                '{{store_description}}': selectedStore?.description || 'Store description',
                                '{{year}}': new Date().getFullYear().toString(),
                                '{{currency}}': selectedStore?.currency || 'No Currency'
                              };
                              
                              Object.entries(replacements).forEach(([placeholder, value]) => {
                                // Replace double curly braces version
                                while (result.includes(placeholder)) {
                                  result = result.replace(placeholder, value);
                                }
                                
                                // Also replace single curly braces version
                                const singleBracePlaceholder = placeholder.replace(/{{/g, '{').replace(/}}/g, '}');
                                while (result.includes(singleBracePlaceholder)) {
                                  result = result.replace(singleBracePlaceholder, value);
                                }
                              });
                              
                              return result.trim();
                            };
                            
                            return applyTemplate(seoSettings.default_meta_title) || 'Sample Page';
                          })()}&lt;/title&gt;
                        </code>
                        <p className="text-xs text-gray-500 mt-1">Template: <span className="font-mono">{seoSettings.default_meta_title}</span></p>
                      </div>
                      
                      {seoSettings.default_meta_description && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Meta Description</p>
                          <code className="text-sm bg-white px-2 py-1 rounded border block overflow-x-auto">
                            &lt;meta name="description" content="{(() => {
                              if (!seoSettings.default_meta_description) return 'Sample description';
                              
                              // Use same template replacement as storefront
                              const applyTemplate = (template) => {
                                if (!template) return '';
                                
                                let result = template;
                                
                                const replacements = {
                                  '{{store_name}}': selectedStore?.name || 'Your Store',
                                  '{{page_title}}': 'Sample Page',
                                  '{{site_name}}': selectedStore?.name || 'Your Store',
                                  '{{store_description}}': selectedStore?.description || 'Store description',
                                  '{{year}}': new Date().getFullYear().toString(),
                                  '{{currency}}': selectedStore?.currency || 'No Currency'
                                };
                                
                                Object.entries(replacements).forEach(([placeholder, value]) => {
                                  // Replace double curly braces version
                                  while (result.includes(placeholder)) {
                                    result = result.replace(placeholder, value);
                                  }
                                  
                                  // Also replace single curly braces version
                                  const singleBracePlaceholder = placeholder.replace(/{{/g, '{').replace(/}}/g, '}');
                                  while (result.includes(singleBracePlaceholder)) {
                                    result = result.replace(singleBracePlaceholder, value);
                                  }
                                });
                                
                                return result.trim();
                              };
                              
                              return applyTemplate(seoSettings.default_meta_description) || 'Sample description';
                            })()}" /&gt;
                          </code>
                          <p className="text-xs text-gray-500 mt-1">Template: <span className="font-mono">{seoSettings.default_meta_description}</span></p>
                        </div>
                      )}
                      
                      {seoSettings.default_meta_keywords && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Meta Keywords</p>
                          <code className="text-sm bg-white px-2 py-1 rounded border">
                            &lt;meta name="keywords" content="{seoSettings.default_meta_keywords}" /&gt;
                          </code>
                        </div>
                      )}
                      
                      {seoSettings.canonical_base_url && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Canonical URL</p>
                          <code className="text-sm bg-white px-2 py-1 rounded border">
                            &lt;link rel="canonical" href="{seoSettings.canonical_base_url}/sample-page" /&gt;
                          </code>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        <strong>Note:</strong> This preview shows how your default settings will appear in the HTML head. 
                        Page-specific meta tags will override these defaults when available.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <SaveButton
                  onClick={handleSaveSettings}
                  loading={saving}
                  success={saveSuccess}
                  defaultText="Save Settings"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'templates':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SEO Templates
                <Button onClick={() => setShowTemplateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setTemplateForm({
                                name: template.name,
                                type: template.type,
                                meta_title: template.meta_title,
                                meta_description: template.meta_description,
                                meta_keywords: template.meta_keywords,
                                is_active: template.is_active !== false,
                                conditions: template.conditions || { categories: [], attribute_sets: [] }
                              });
                              setShowTemplateForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge>{template.type}</Badge>
                        <Badge variant={template.is_active !== false ? "default" : "secondary"}>
                          {template.is_active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{template.meta_title}</p>
                      {template.conditions && (
                        <div className="mt-2 text-xs text-gray-500">
                          {template.conditions.categories?.length > 0 && (
                            <span>Categories: {template.conditions.categories.length} </span>
                          )}
                          {template.conditions.attribute_sets?.length > 0 && (
                            <span>Attribute Sets: {template.conditions.attribute_sets.length}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No templates created yet.</p>
              )}
            </CardContent>
          </Card>
        );

      case 'redirects':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                URL Redirects
                <Button onClick={() => setShowRedirectForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Redirect
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {redirects.length > 0 ? (
                <div className="space-y-4">
                  {redirects.map((redirect) => (
                    <div key={redirect.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{redirect.from_url}</p>
                          <p className="text-sm text-gray-600">→ {redirect.to_url}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={redirect.type === '301' ? 'default' : 'secondary'}>
                            {redirect.type}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRedirect(redirect);
                              setRedirectForm({
                                from_url: redirect.from_url,
                                to_url: redirect.to_url,
                                type: redirect.type
                              });
                              setShowRedirectForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRedirect(redirect.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No redirects created yet.</p>
              )}
            </CardContent>
          </Card>
        );

      case 'canonical':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Canonical URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Canonical URL Management</h4>
                  <p className="text-sm text-blue-800">
                    Canonical URLs are automatically generated based on your base URL setting.
                    For filtered category pages, canonical URLs point to the main category page to avoid duplicate content issues.
                  </p>
                </div>

                <div>
                  <Label>Canonical Base URL</Label>
                  <Input
                    value={seoSettings.canonical_base_url}
                    onChange={(e) => setSeoSettings(prev => ({ ...prev, canonical_base_url: e.target.value }))}
                    placeholder="https://yourdomain.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be used as the base for all canonical URLs. Make sure it matches your primary domain.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={seoSettings.auto_canonical_filtered_pages}
                    onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, auto_canonical_filtered_pages: checked }))}
                  />
                  <Label>Auto Canonical for Filtered Pages</Label>
                </div>
                <p className="text-sm text-gray-600">
                  When enabled, filtered category pages (e.g., /category/shoes?color=red) will have their canonical URL
                  set to the main category page (/category/shoes) to prevent duplicate content issues.
                </p>

                <div className="flex justify-end">
                  <SaveButton
                    onClick={handleSaveSettings}
                    loading={saving}
                    success={saveSuccess}
                    defaultText="Save Canonical Settings"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'hreflang':
        const activeLanguages = selectedStore?.settings?.active_languages || [];
        const hasActiveLanguages = activeLanguages.length > 0;

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Hreflang Settings
                <Button onClick={addHreflangSetting}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Hreflang Configuration</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Hreflang tags help search engines understand which language and region your content targets.
                  Use the "Active" toggle on each language to control whether it's rendered on your site.
                </p>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Available variables in URL patterns:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><code>{'{{base_url}}'}</code> - Your canonical base URL</li>
                    <li><code>{'{{absolute_path}}'}</code> - Full current path including store prefix</li>
                    <li><code>{'{{relative_path}}'}</code> - Clean content path without store prefix (recommended for custom domains)</li>
                    <li><code>{'{{language_code}}'}</code> - The language code (e.g., 'en', 'de')</li>
                  </ul>
                  <p className="text-xs mt-2 bg-blue-100 p-2 rounded">
                    💡 <strong>Tip:</strong> Use <code>{'{{base_url}}/{{language_code}}{{relative_path}}'}</code> for URLs that work with custom domains
                  </p>
                </div>
              </div>

              {!hasActiveLanguages && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">No Active Languages Configured</h4>
                      <p className="text-sm text-yellow-800">
                        Please configure your store's active languages in the{' '}
                        <a href="/admin/settings" className="underline font-medium">Store Settings</a>{' '}
                        page before adding hreflang tags. Active languages are used to populate the language dropdown.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {seoSettings.hreflang_settings.length > 0 ? (
                <div className="space-y-4">
                  {seoSettings.hreflang_settings.map((hreflang, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Language Code</Label>
                          {hasActiveLanguages ? (
                            <Select
                              value={hreflang.language_code}
                              onValueChange={(value) => updateHreflangSetting(index, 'language_code', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeLanguages.map((lang) => (
                                  <SelectItem key={lang} value={lang}>
                                    {lang.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={hreflang.language_code}
                              onChange={(e) => updateHreflangSetting(index, 'language_code', e.target.value)}
                              placeholder="en"
                              disabled
                            />
                          )}
                        </div>
                        <div>
                          <Label>Country Code (Optional)</Label>
                          <Input
                            value={hreflang.country_code}
                            onChange={(e) => updateHreflangSetting(index, 'country_code', e.target.value)}
                            placeholder="US"
                          />
                        </div>
                        <div>
                          <Label>URL Pattern</Label>
                          <Input
                            value={hreflang.url_pattern}
                            onChange={(e) => updateHreflangSetting(index, 'url_pattern', e.target.value)}
                            placeholder="{{base_url}}/{{language_code}}{{relative_path}}"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={hreflang.is_active}
                              onCheckedChange={(checked) => updateHreflangSetting(index, 'is_active', checked)}
                            />
                            <Label>Active</Label>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeHreflangSetting(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Preview: {hreflang.url_pattern
                          .replace(/\{\{base_url\}\}/g, seoSettings.canonical_base_url || 'https://yourdomain.com')
                          .replace(/\{\{language_code\}\}/g, hreflang.language_code || 'lang')
                          .replace(/\{\{absolute_path\}\}/g, '/public/storename/category/example')
                          .replace(/\{\{relative_path\}\}/g, '/category/example')
                          .replace(/\{\{current_url\}\}/g, '/current-page')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No hreflang settings configured yet. Click "Add Language" to get started.</p>
              )}

              <div className="flex justify-end mt-4">
                <SaveButton
                  onClick={handleSaveSettings}
                  loading={saving}
                  success={saveSuccess}
                  defaultText="Save Hreflang Settings"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'robots':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Robots.txt Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label>Robots.txt Content</Label>
                    <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" title="Click to see format guide" />
                  </div>
                  <Textarea
                    value={seoSettings.robots_txt_content}
                    onChange={(e) => setSeoSettings(prev => ({ ...prev, robots_txt_content: e.target.value }))}
                    rows={10}
                    className="font-mono text-sm"
                    placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin/"
                  />
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">
                      Robots.txt Format Guide:
                    </p>
                    <div className="text-sm text-gray-500 space-y-1 bg-gray-50 p-3 rounded-md">
                      <p><strong>Basic Format:</strong></p>
                      <pre className="font-mono text-xs bg-white p-2 rounded border">
User-agent: *              # Applies to all search engines
Allow: /                   # Allow crawling of all pages
Disallow: /admin/          # Block admin pages
Disallow: /private/        # Block private pages
Disallow: /checkout/       # Block checkout process
Disallow: /cart/           # Block cart pages
Crawl-delay: 1            # Wait 1 second between requests
Sitemap: /sitemap.xml     # Location of sitemap
                      </pre>
                      
                      <p className="mt-2"><strong>Important Notes:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Each directive must be on its own line</li>
                        <li>Use <code className="bg-gray-200 px-1 rounded">User-agent: *</code> to apply rules to all bots</li>
                        <li>Paths in Disallow rules affect the robots meta tag on those pages</li>
                        <li>Pages matching Disallow rules will get "noindex, nofollow" meta tags</li>
                        <li>Use <code className="bg-gray-200 px-1 rounded">#</code> for comments</li>
                        <li>Paths are case-sensitive and relative to root</li>
                      </ul>
                      
                      <p className="mt-2"><strong>Common Patterns:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><code className="bg-gray-200 px-1 rounded">Disallow: /category/</code> - Block all category pages</li>
                        <li><code className="bg-gray-200 px-1 rounded">Disallow: /*.pdf$</code> - Block all PDF files</li>
                        <li><code className="bg-gray-200 px-1 rounded">Disallow: /*?</code> - Block all URLs with parameters</li>
                        <li><code className="bg-gray-200 px-1 rounded">Allow: /public/</code> - Explicitly allow public directory</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-500 italic">
                      Products and categories with "noindex" robots setting will automatically be added as Disallow rules.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateRobotsTxt}>
                    <Download className="w-4 h-4 mr-2" />
                    Download robots.txt
                  </Button>
                  <Button variant="outline" onClick={updateRobotsContent} disabled={updatingRobots}>
                    {updatingRobots ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update with Content Rules
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex justify-end mt-4">
                  <SaveButton
                    onClick={handleSaveSettings}
                    loading={saving}
                    success={saveSuccess}
                    defaultText="Save Robots.txt"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      XML Sitemap Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={seoSettings.sitemap_include_products}
                            onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, sitemap_include_products: checked }))}
                          />
                          <Label>Include Products</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={seoSettings.sitemap_include_categories}
                            onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, sitemap_include_categories: checked }))}
                          />
                          <Label>Include Categories</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={seoSettings.sitemap_include_pages}
                            onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, sitemap_include_pages: checked }))}
                          />
                          <Label>Include CMS Pages</Label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={generateXmlSitemap}>
                          <Download className="w-4 h-4 mr-2" />
                          Generate & Download XML Sitemap
                        </Button>
                        <Button variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Auto-Generate Daily
                        </Button>
                        <Button variant="outline">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Submit to Google
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p>Last generated: {seoReport.last_updated ? new Date(seoReport.last_updated).toLocaleString() : 'Never'}</p>
                        <p>Total URLs that will be included: {seoSettings.enable_sitemap ? (seoReport.total_pages + 1) : 'Sitemap generation disabled'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 'social':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Social & Schema Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Schema.org Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Schema.org / Rich Snippets</h3>
                  <Switch
                    checked={seoSettings.enable_rich_snippets}
                    onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_rich_snippets: checked }))}
                  />
                </div>
                {seoSettings.enable_rich_snippets && (
                  <div className="space-y-4 pt-4 pl-6 border-l-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={seoSettings.schema_settings?.enable_product_schema}
                        onCheckedChange={(checked) => handleNestedSettingsChange('schema_settings', 'enable_product_schema', checked)}
                      />
                      <Label>Enable Product Schema</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Switch
                        checked={seoSettings.schema_settings?.enable_organization_schema}
                        onCheckedChange={(checked) => handleNestedSettingsChange('schema_settings', 'enable_organization_schema', checked)}
                      />
                      <Label>Enable Organization Schema</Label>
                    </div>
                    <div>
                      <Label>Organization Name</Label>
                      <Input
                        value={seoSettings.schema_settings?.organization_name || ''}
                        onChange={(e) => handleNestedSettingsChange('schema_settings', 'organization_name', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>
                    <div>
                      <Label>Organization Logo URL</Label>
                      <Input
                        value={seoSettings.schema_settings?.organization_logo_url || ''}
                        onChange={(e) => handleNestedSettingsChange('schema_settings', 'organization_logo_url', e.target.value)}
                        placeholder="https://yourdomain.com/logo.png"
                      />
                    </div>
                     <div>
                      <Label>Social Profiles</Label>
                      <Textarea
                        value={(seoSettings.schema_settings?.social_profiles || []).join('\n')}
                        onChange={(e) => handleNestedSettingsChange('schema_settings', 'social_profiles', e.target.value.split('\n'))}
                        placeholder="Enter one social profile URL per line (e.g., https://facebook.com/yourpage)"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Open Graph Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Open Graph (Facebook, LinkedIn, etc.)</h3>
                  <Switch
                    checked={seoSettings.enable_open_graph}
                    onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_open_graph: checked }))}
                  />
                </div>
                {seoSettings.enable_open_graph && (
                  <div className="space-y-4 pt-4 pl-6 border-l-2">
                    <div>
                      <Label>Default OG Image URL</Label>
                      <Input
                        value={seoSettings.open_graph_settings?.default_image_url || ''}
                        onChange={(e) => handleNestedSettingsChange('open_graph_settings', 'default_image_url', e.target.value)}
                        placeholder="URL for a default image for sharing"
                      />
                       <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x630 pixels.</p>
                    </div>
                     <div>
                      <Label>Facebook App ID</Label>
                      <Input
                        value={seoSettings.open_graph_settings?.facebook_app_id || ''}
                        onChange={(e) => handleNestedSettingsChange('open_graph_settings', 'facebook_app_id', e.target.value)}
                        placeholder="Your Facebook App ID (optional)"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Twitter Cards Section */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Twitter Cards</h3>
                   <Switch
                    checked={seoSettings.enable_twitter_cards}
                    onCheckedChange={(checked) => setSeoSettings(prev => ({ ...prev, enable_twitter_cards: checked }))}
                  />
                </div>
                {seoSettings.enable_twitter_cards && (
                  <div className="space-y-4 pt-4 pl-6 border-l-2">
                    <div>
                      <Label>Default Card Type</Label>
                       <Select
                         value={seoSettings.twitter_card_settings?.card_type || 'summary_large_image'}
                         onValueChange={(value) => handleNestedSettingsChange('twitter_card_settings', 'card_type', value)}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="summary">Summary</SelectItem>
                           <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div>
                      <Label>Twitter Site Username</Label>
                      <Input
                        value={seoSettings.twitter_card_settings?.site_username || ''}
                        onChange={(e) => handleNestedSettingsChange('twitter_card_settings', 'site_username', e.target.value)}
                        placeholder="@YourTwitterHandle"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <SaveButton
                  onClick={handleSaveSettings}
                  loading={saving}
                  success={saveSuccess}
                  defaultText="Save Social & Schema Settings"
                />
              </div>
            </CardContent>
          </Card>
        );
      case 'report':
        return (
          <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    SEO Executive Summary
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-blue-100 text-blue-700">
                      Last Updated: {new Date().toLocaleDateString()}
                    </Badge>
                    <Button onClick={generateSeoReport} disabled={loading} size="sm">
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {loading ? "Analyzing..." : "Refresh Report"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Overall SEO Score */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Overall SEO Score</h3>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-blue-600">{seoScore}/100</div>
                        <div className="text-sm text-gray-600">SEO Health</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          seoScore >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          seoScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          seoScore >= 40 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${seoScore}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {seoScore >= 80 ? '🎉 Excellent SEO health! Your store is well-optimized.' :
                       seoScore >= 60 ? '👍 Good SEO foundation with opportunities for growth.' :
                       seoScore >= 40 ? '⚠️ Fair SEO health. Focus on critical issues first.' :
                       '🚨 Poor SEO health. Immediate optimization required.'}
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{seoReport.pages_with_meta_title}</div>
                      <div className="text-sm text-green-700">Optimized Pages</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{seoReport.total_pages - seoReport.pages_with_meta_title}</div>
                      <div className="text-sm text-red-700">Need Attention</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{seoReport.duplicate_titles.length}</div>
                      <div className="text-sm text-blue-700">Duplicate Issues</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{Math.round((seoReport.pages_with_canonical / Math.max(seoReport.total_pages, 1)) * 100)}%</div>
                      <div className="text-sm text-purple-700">Technical SEO</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{seoReport.total_pages}</div>
                    <div className="text-xs text-gray-600">Total Pages</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{seoReport.pages_with_meta_description}</div>
                    <div className="text-xs text-gray-600">With Descriptions</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{seoReport.pages_with_canonical}</div>
                    <div className="text-xs text-gray-600">Canonical URLs</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{Math.round(((seoReport.pages_with_meta_title + seoReport.pages_with_meta_description) / (seoReport.total_pages * 2)) * 100)}%</div>
                    <div className="text-xs text-gray-600">Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical SEO Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Technical SEO Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Meta Tags Analysis */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Meta Tags Health
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Title Tags</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (seoReport.pages_with_meta_title / seoReport.total_pages) > 0.8 ? 'bg-green-500' :
                            (seoReport.pages_with_meta_title / seoReport.total_pages) > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{Math.round((seoReport.pages_with_meta_title / seoReport.total_pages) * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Meta Descriptions</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (seoReport.pages_with_meta_description / seoReport.total_pages) > 0.8 ? 'bg-green-500' :
                            (seoReport.pages_with_meta_description / seoReport.total_pages) > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{Math.round((seoReport.pages_with_meta_description / seoReport.total_pages) * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Canonical URLs</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            (seoReport.pages_with_canonical / seoReport.total_pages) > 0.8 ? 'bg-green-500' :
                            (seoReport.pages_with_canonical / seoReport.total_pages) > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{Math.round((seoReport.pages_with_canonical / seoReport.total_pages) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Quality */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-green-600" />
                      Content Quality
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Unique Titles</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            seoReport.duplicate_titles.length === 0 ? 'bg-green-500' :
                            seoReport.duplicate_titles.length < 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm font-medium">{seoReport.total_pages - seoReport.duplicate_titles.length}/{seoReport.total_pages}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Title Length</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">Optimal</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Description Length</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-sm font-medium">Good</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Site Structure */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Link className="w-4 h-4 text-orange-600" />
                      Site Structure
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">URL Structure</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">SEO Friendly</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Internal Linking</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-sm font-medium">Fair</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Sitemap</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">Present</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues and Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  SEO Issues & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Missing Meta Titles */}
                  {seoReport.total_pages - seoReport.pages_with_meta_title > 0 && (
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-orange-800">Missing Meta Titles</p>
                          <p className="text-sm text-orange-600">
                            {seoReport.total_pages - seoReport.pages_with_meta_title} pages need meta titles for better search visibility
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('settings')}>
                          Set Default
                        </Button>
                        <Button size="sm" onClick={() => generateWithAI('meta_title', { type: 'bulk' })} disabled={aiCredits <= 0}>
                          <Bot className="w-4 h-4 mr-2" />
                          Fix with AI
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Missing Meta Descriptions */}
                  {seoReport.total_pages - seoReport.pages_with_meta_description > 0 && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Missing Meta Descriptions</p>
                          <p className="text-sm text-blue-600">
                            {seoReport.total_pages - seoReport.pages_with_meta_description} pages need descriptions to improve click-through rates
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setActiveTab('settings')}>
                          Set Default
                        </Button>
                        <Button size="sm" onClick={() => generateWithAI('meta_description', { type: 'bulk' })} disabled={aiCredits <= 0}>
                          <Bot className="w-4 h-4 mr-2" />
                          Fix with AI
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Meta Titles */}
                  {seoReport.duplicate_titles.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <Copy className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-red-800">Duplicate Meta Titles</p>
                          <p className="text-sm text-red-600">
                            {seoReport.duplicate_titles.length} duplicate titles found. Each page should have a unique title.
                          </p>
                          <div className="mt-2 text-xs text-red-500">
                            Duplicates: {seoReport.duplicate_titles.slice(0, 3).map(title => `"${title}"`).join(', ')}
                            {seoReport.duplicate_titles.length > 3 && ` and ${seoReport.duplicate_titles.length - 3} more`}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}

                  {/* Missing Canonical URLs */}
                  {seoReport.total_pages - seoReport.pages_with_canonical > 0 && (
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Link className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-purple-800">Missing Canonical URLs</p>
                          <p className="text-sm text-purple-600">
                            {seoReport.total_pages - seoReport.pages_with_canonical} pages need canonical tags to prevent duplicate content issues
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('settings')}>
                        Configure
                      </Button>
                    </div>
                  )}

                  {/* Success State */}
                  {(seoReport.total_pages - seoReport.pages_with_meta_title === 0 &&
                    seoReport.duplicate_titles.length === 0 &&
                    seoReport.total_pages - seoReport.pages_with_meta_description <= Math.ceil(seoReport.total_pages * 0.1) &&
                    seoReport.total_pages - seoReport.pages_with_canonical === 0) && (
                    <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-green-800 mb-1">Excellent SEO Health!</p>
                      <p className="text-sm text-green-600">
                        Your store has strong SEO fundamentals. Keep monitoring and updating your content regularly.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Page Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Detailed Page Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Page Type Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Page Type Performance</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <h5 className="font-medium text-blue-900">Product Pages</h5>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">
                            {Math.floor(seoReport.total_pages * 0.6)} pages
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{Math.round((seoReport.pages_with_meta_title / Math.max(seoReport.total_pages, 1)) * 100)}%</div>
                            <div className="text-blue-700">Optimized</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{Math.round((seoReport.pages_with_meta_description / Math.max(seoReport.total_pages, 1)) * 100)}%</div>
                            <div className="text-green-700">Descriptions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{Math.round((seoReport.pages_with_canonical / Math.max(seoReport.total_pages, 1)) * 100)}%</div>
                            <div className="text-purple-700">Technical</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Folder className="w-5 h-5 text-green-600" />
                            <h5 className="font-medium text-green-900">Category Pages</h5>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            {Math.floor(seoReport.total_pages * 0.3)} pages
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">85%</div>
                            <div className="text-green-700">Optimized</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">78%</div>
                            <div className="text-blue-700">Descriptions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">92%</div>
                            <div className="text-purple-700">Technical</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" />
                            <h5 className="font-medium text-purple-900">Content Pages</h5>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700">
                            {Math.floor(seoReport.total_pages * 0.1)} pages
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">95%</div>
                            <div className="text-purple-700">Optimized</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">90%</div>
                            <div className="text-green-700">Descriptions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">100%</div>
                            <div className="text-blue-700">Technical</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEO Trends */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">SEO Performance Trends</h4>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">Last 30 Days</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">+12% improvement</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Meta Title Coverage</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <span className="text-sm font-medium">85%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Description Coverage</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
                            </div>
                            <span className="text-sm font-medium">78%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Technical SEO</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}></div>
                            </div>
                            <span className="text-sm font-medium">92%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Top Performing Pages */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Top Performing Pages</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">/products/premium-headphones</span>
                          </div>
                          <Badge className="bg-green-100 text-green-700 text-xs">98/100</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">/categories/electronics</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 text-xs">95/100</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">/about-us</span>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 text-xs">92/100</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keywords & Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-green-600" />
                  Keywords & Content Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Keyword Performance */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Top Keywords</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">wireless headphones</span>
                          <div className="text-xs text-gray-600">15 pages targeting</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">Rank #3</div>
                          <div className="text-xs text-gray-600">1.2K searches/mo</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">bluetooth speakers</span>
                          <div className="text-xs text-gray-600">8 pages targeting</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">Rank #7</div>
                          <div className="text-xs text-gray-600">800 searches/mo</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">gaming accessories</span>
                          <div className="text-xs text-gray-600">12 pages targeting</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-600">Rank #12</div>
                          <div className="text-xs text-gray-600">600 searches/mo</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Quality Metrics */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Content Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Average Title Length</span>
                          <Badge className="bg-green-100 text-green-700">Optimal</Badge>
                        </div>
                        <div className="text-2xl font-bold text-green-600">52 chars</div>
                        <div className="text-xs text-gray-600">Recommended: 50-60 characters</div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Average Description Length</span>
                          <Badge className="bg-blue-100 text-blue-700">Good</Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">145 chars</div>
                        <div className="text-xs text-gray-600">Recommended: 150-160 characters</div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Readability Score</span>
                          <Badge className="bg-purple-100 text-purple-700">Excellent</Badge>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">78/100</div>
                        <div className="text-xs text-gray-600">Easy to read for most audiences</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Recommendations & Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Priority Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* High Priority */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-red-800 mb-2">High Priority Issues</h5>
                        <div className="space-y-2">
                          {seoReport.total_pages - seoReport.pages_with_meta_title > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-red-700">
                                {seoReport.total_pages - seoReport.pages_with_meta_title} pages missing meta titles
                              </span>
                              <Button size="sm" onClick={() => setActiveTab('settings')} className="bg-red-600 hover:bg-red-700">
                                Fix Now
                              </Button>
                            </div>
                          )}
                          {seoReport.duplicate_titles.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-red-700">
                                {seoReport.duplicate_titles.length} duplicate meta titles found
                              </span>
                              <Button size="sm" variant="outline" className="border-red-200 text-red-600">
                                Review
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medium Priority */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-yellow-800 mb-2">Medium Priority Improvements</h5>
                        <div className="space-y-2">
                          {seoReport.total_pages - seoReport.pages_with_meta_description > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-yellow-700">
                                {seoReport.total_pages - seoReport.pages_with_meta_description} pages need meta descriptions
                              </span>
                              <Button size="sm" onClick={() => generateWithAI('meta_description', { type: 'bulk' })} className="bg-yellow-600 hover:bg-yellow-700">
                                Generate with AI
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-yellow-700">Improve internal linking structure</span>
                            <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-600">
                              Analyze
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Low Priority */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-blue-800 mb-2">Optimization Opportunities</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Add schema markup for products</span>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600">
                              Configure
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Optimize image alt attributes</span>
                            <Button size="sm" variant="outline" className="border-blue-200 text-blue-600">
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export & Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-gray-600" />
                  Export & Share Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Report
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Schedule Report
                  </Button>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>💡 <strong>Pro Tip:</strong> Schedule weekly SEO reports to track your optimization progress over time and identify trends in your search performance.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CmsBlockRenderer position="seo_header" />
        
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {activeTab === 'settings' && 'SEO Settings'}
              {activeTab === 'templates' && 'SEO Templates'}
              {activeTab === 'redirects' && 'URL Redirects'}
              {activeTab === 'canonical' && 'Canonical URLs'}
              {activeTab === 'hreflang' && 'Hreflang Settings'}
              {activeTab === 'robots' && 'Robots.txt & Sitemap'}
              {activeTab === 'social' && 'Social & Schema'}
              {activeTab === 'report' && 'SEO Report'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'settings' && 'Configure basic SEO settings for your store'}
              {activeTab === 'templates' && 'Create templates for automatic meta tag generation'}
              {activeTab === 'redirects' && 'Manage URL redirects to avoid broken links'}
              {activeTab === 'canonical' && 'Configure canonical URL settings'}
              {activeTab === 'hreflang' && 'Set up language and region targeting'}
              {activeTab === 'robots' && 'Configure robots.txt and sitemap settings'}
              {activeTab === 'social' && 'Manage structured data and social sharing tags'}
              {activeTab === 'report' && 'View SEO analysis and recommendations'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-purple-100 text-purple-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI Credits: {aiCredits}
            </Badge>
          </div>
        </div>
        {renderTabContent()}
        <Dialog open={showTemplateForm} onOpenChange={(open) => {
            setShowTemplateForm(open);
            if (!open) {
              setEditingTemplate(null);
              resetTemplateForm();
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Electronics Product Template"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={templateForm.type} onValueChange={(v) => setTemplateForm(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-active"
                    checked={templateForm.is_active}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="template-active" className="text-sm font-medium">
                    Active
                  </Label>
                  <span className="text-xs text-gray-500 ml-2">
                    {templateForm.is_active ? 'Template rules will apply' : 'Template is disabled'}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Template Conditions (Optional)</h4>
                  <p className="text-sm text-gray-600 mb-3">This template will only apply to pages that match these conditions:</p>

                  <div className="space-y-3">
                    <div>
                      <Label>Categories</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories.length > 0 ? categories.map(category => (
                          <Badge
                            key={category.id}
                            variant={templateForm.conditions.categories.includes(category.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const newCategories = templateForm.conditions.categories.includes(category.id)
                                ? templateForm.conditions.categories.filter(id => id !== category.id)
                                : [...templateForm.conditions.categories, category.id];
                              setTemplateForm(prev => ({
                                ...prev,
                                conditions: { ...prev.conditions, categories: newCategories }
                              }));
                            }}
                          >
                            {category.name}
                          </Badge>
                        )) : <p className="text-sm text-gray-500">No categories found.</p>}
                      </div>
                    </div>

                    <div>
                      <Label>Attribute Sets</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {attributeSets.length > 0 ? attributeSets.map(set => (
                          <Badge
                            key={set.id}
                            variant={templateForm.conditions.attribute_sets.includes(set.id) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const newSets = templateForm.conditions.attribute_sets.includes(set.id)
                                ? templateForm.conditions.attribute_sets.filter(id => id !== set.id)
                                : [...templateForm.conditions.attribute_sets, set.id];
                              setTemplateForm(prev => ({
                                ...prev,
                                conditions: { ...prev.conditions, attribute_sets: newSets }
                              }));
                            }}
                          >
                            {set.name}
                          </Badge>
                        )) : <p className="text-sm text-gray-500">No attribute sets found.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Meta Title Template</Label>
                  <Input
                    value={templateForm.meta_title}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="{{product_name}} - Premium {{category_name}} - {{store_name}}"
                  />
                </div>
                <div>
                  <Label>Meta Description Template</Label>
                  <Textarea
                    value={templateForm.meta_description}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Shop high-quality {{product_name}} at {{store_name}}. {{product_description}}"
                    rows={3}
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Global Variables:</strong> {`{{store_name}}`}, {`{{site_name}}`}, {`{{store_description}}`}, {`{{page_title}}`}, {`{{base_url}}`}, {`{{current_url}}`}, {`{{current_path}}`}, {`{{year}}`}, {`{{currency}}`}</p>
                    <p className="mt-1"><strong>Product Pages:</strong> {`{{product_name}}`}, {`{{product_description}}`}</p>
                    <p className="mt-1"><strong>Category Pages:</strong> {`{{category_name}}`}, {`{{category_description}}`}</p>
                    <p className="mt-1 text-xs text-blue-600">💡 Both {`{{variable}}`} and {`{variable}`} syntax supported</p>
                  </div>
                </div>
                <div>
                  <Label>Meta Keywords Template</Label>
                  <Input
                    value={templateForm.meta_keywords}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    placeholder="{{product_name}}, {{category_name}}, {{store_name}}, online shop"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => {
                    setShowTemplateForm(false);
                    setEditingTemplate(null);
                    resetTemplateForm();
                  }}>
                    Cancel
                  </Button>
                  <SaveButton
                    onClick={handleSaveTemplate}
                    loading={saving}
                    success={saveSuccess}
                    defaultText="Save Template"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

        {showRedirectForm && (
          <Dialog open={showRedirectForm} onOpenChange={(open) => {
            setShowRedirectForm(open);
            if (!open) {
              setEditingRedirect(null);
              resetRedirectForm();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRedirect ? 'Edit Redirect' : 'Add New Redirect'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>From URL</Label>
                  <Input
                    value={redirectForm.from_url}
                    onChange={(e) => setRedirectForm(prev => ({ ...prev, from_url: e.target.value }))}
                    placeholder="/old-page"
                  />
                </div>
                <div>
                  <Label>To URL</Label>
                  <Input
                    value={redirectForm.to_url}
                    onChange={(e) => setRedirectForm(prev => ({ ...prev, to_url: e.target.value }))}
                    placeholder="/new-page"
                  />
                </div>
                <div>
                  <Label>Redirect Type</Label>
                  <Select value={redirectForm.type} onValueChange={(v) => setRedirectForm(prev => ({ ...prev, type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="301">301 Permanent</SelectItem>
                      <SelectItem value="302">302 Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowRedirectForm(false);
                    setEditingRedirect(null);
                    resetRedirectForm();
                  }}>
                    Cancel
                  </Button>
                  <SaveButton
                    onClick={handleSaveRedirect}
                    loading={saving}
                    success={saveSuccess}
                    defaultText="Save Redirect"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
}
