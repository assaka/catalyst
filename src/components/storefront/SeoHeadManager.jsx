import React, { useEffect } from 'react';
import { useStore } from './StoreProvider';

export default function SeoHeadManager({ pageType, pageData, pageTitle, pageDescription, imageUrl }) {
    const { store, seoSettings, seoTemplates } = useStore();

    useEffect(() => {
        // Don't proceed if we don't have store data yet
        if (!store || !store.id) {
            return;
        }

        
        // Default values
        const defaultTitle = store?.name ? `${pageTitle} | ${store.name}` : pageTitle;
        const defaultDescription = pageDescription || store?.description || '';

        // Determine the robots tag
        const robotsTag = pageData?.meta_robots_tag || 
                          pageData?.seo?.meta_robots_tag || 
                          'index, follow';

        // Use page data or templates
        const title = pageData?.meta_title || pageData?.seo?.meta_title || defaultTitle;
        const description = pageData?.meta_description || pageData?.seo?.meta_description || defaultDescription;
        const keywords = pageData?.meta_keywords || pageData?.seo?.meta_keywords || '';

        const ogImage = imageUrl || 
                       pageData?.images?.[0] || 
                       seoSettings?.open_graph_settings?.default_image_url || 
                       store?.logo_url;


        // Update document title
        document.title = title;

        // Function to update or create meta tag
        const updateMetaTag = (name, content, property = false) => {
            if (!content) {
                return;
            }
            
            const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let metaTag = document.querySelector(selector);
            
            if (!metaTag) {
                metaTag = document.createElement('meta');
                if (property) {
                    metaTag.setAttribute('property', name);
                } else {
                    metaTag.setAttribute('name', name);
                }
                document.head.appendChild(metaTag);
            }
            
            metaTag.setAttribute('content', content);
        };

        // Update basic meta tags
        updateMetaTag('description', description);
        if (keywords) updateMetaTag('keywords', keywords);
        updateMetaTag('robots', robotsTag);

        // Open Graph Tags (check if enabled - default to true if seoSettings not loaded yet)
        const enableOpenGraph = seoSettings?.enable_open_graph !== false;
        if (enableOpenGraph) {
            updateMetaTag('og:title', title, true);
            updateMetaTag('og:description', description, true);
            updateMetaTag('og:type', pageType === 'product' ? 'product' : 'website', true);
            if (ogImage) {
                updateMetaTag('og:image', ogImage, true);
                updateMetaTag('og:image:alt', `${title} - ${store.name}`, true);
            }
            if (store?.name) updateMetaTag('og:site_name', store.name, true);
            updateMetaTag('og:url', window.location.href, true);
            
            // Facebook App ID if provided
            if (seoSettings?.open_graph_settings?.facebook_app_id) {
                updateMetaTag('fb:app_id', seoSettings.open_graph_settings.facebook_app_id, true);
            }
        }

        // Twitter Card Tags (check if enabled - default to true if seoSettings not loaded yet)
        const enableTwitterCards = seoSettings?.enable_twitter_cards !== false;
        if (enableTwitterCards) {
            const cardType = seoSettings?.twitter_card_settings?.card_type || 'summary_large_image';
            updateMetaTag('twitter:card', cardType);
            updateMetaTag('twitter:title', title);
            updateMetaTag('twitter:description', description);
            if (ogImage) {
                updateMetaTag('twitter:image', ogImage);
                updateMetaTag('twitter:image:alt', `${title} - ${store.name}`);
            }
            
            // Twitter site username if provided
            if (seoSettings?.twitter_card_settings?.site_username) {
                const username = seoSettings.twitter_card_settings.site_username.startsWith('@') 
                    ? seoSettings.twitter_card_settings.site_username 
                    : `@${seoSettings.twitter_card_settings.site_username}`;
                updateMetaTag('twitter:site', username);
            }
        }

        // Rich Snippets / Schema.org (check if enabled - default to true if seoSettings not loaded yet)
        const enableRichSnippets = seoSettings?.enable_rich_snippets !== false;
        
        // Product-specific Schema.org structured data
        if (enableRichSnippets && pageType === 'product' && pageData) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="product"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableProductSchema = seoSettings?.schema_settings?.enable_product_schema !== false;
            if (enableProductSchema) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.setAttribute('data-type', 'product');
                
                const structuredData = {
                    "@context": "https://schema.org/",
                    "@type": "Product",
                    "name": pageData.name,
                    "description": pageData.description || pageData.short_description || defaultDescription,
                    "image": Array.isArray(pageData.images) ? pageData.images : (pageData.images ? [pageData.images] : []),
                    "sku": pageData.sku,
                    "brand": {
                        "@type": "Brand",
                        "name": seoSettings?.schema_settings?.organization_name || store?.name || "Store"
                    },
                    "offers": {
                        "@type": "Offer",
                        "url": window.location.href,
                        "priceCurrency": store?.currency || "USD",
                        "price": pageData.price,
                        "availability": (pageData.stock_quantity > 0 || pageData.infinite_stock) ? 
                            "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                    }
                };

                script.textContent = JSON.stringify(structuredData);
                document.head.appendChild(script);
            }
        }

        // Organization structured data for non-product pages
        if (enableRichSnippets && pageType !== 'product' && store) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableOrgSchema = seoSettings?.schema_settings?.enable_organization_schema !== false;
            if (enableOrgSchema) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.setAttribute('data-type', 'organization');
                
                const structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": seoSettings?.schema_settings?.organization_name || store.name,
                    "description": store.description || defaultDescription,
                    "url": window.location.origin
                };

                // Add logo if provided
                if (seoSettings?.schema_settings?.organization_logo_url) {
                    structuredData.logo = seoSettings.schema_settings.organization_logo_url;
                }

                // Add social profiles if provided
                if (seoSettings?.schema_settings?.social_profiles && Array.isArray(seoSettings.schema_settings.social_profiles) && seoSettings.schema_settings.social_profiles.length > 0) {
                    const validProfiles = seoSettings.schema_settings.social_profiles.filter(profile => profile && profile.trim());
                    if (validProfiles.length > 0) {
                        structuredData.sameAs = validProfiles;
                    }
                }

                script.textContent = JSON.stringify(structuredData);
                document.head.appendChild(script);
            }
        }

        // Website structured data for homepage
        if (enableRichSnippets && pageType === 'homepage' && store) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="website"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-type', 'website');
            
            const structuredData = {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": store.name,
                "description": store.description || defaultDescription,
                "url": window.location.origin
            };

            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);
        }


        // Cleanup function
        return () => {
        };
    }, [pageType, pageData, pageTitle, pageDescription, imageUrl, store, seoSettings, seoTemplates]);

    return null;
}