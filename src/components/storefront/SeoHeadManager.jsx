import React, { useEffect, useState } from 'react';
import { useStore } from './StoreProvider';
import { useSeoSettings } from './SeoSettingsProvider';
import apiClient from '@/api/client';

export default function SeoHeadManager({ pageType, pageData, pageTitle, pageDescription, imageUrl }) {
    const storeContext = useStore();
    const seoContext = useSeoSettings();

    // Handle cases where components are used outside of providers
    const store = storeContext?.store || {};
    const seoTemplates = storeContext?.seoTemplates || {};
    const seoSettings = seoContext?.seoSettings || {};

    const [customCanonicalUrl, setCustomCanonicalUrl] = useState(null);

    // Fetch custom canonical URL for the current page
    useEffect(() => {
        const fetchCustomCanonical = async () => {
            if (!store?.id) return;

            try {
                // Extract relative path without store-specific prefix
                const absolutePath = window.location.pathname || '';
                let relativePath = absolutePath;

                // Remove store-specific prefix like /public/hamid2 to get the actual content path
                if (store?.slug) {
                    const storePrefix = `/public/${store.slug}`;
                    if (absolutePath.startsWith(storePrefix)) {
                        relativePath = absolutePath.substring(storePrefix.length) || '/';
                    }
                }

                // Check if there's a custom canonical URL for this path
                const response = await apiClient.get(`/canonical-urls/check?store_id=${store.id}&path=${encodeURIComponent(relativePath)}`);

                if (response?.found && response?.canonical_url) {
                    setCustomCanonicalUrl(response.canonical_url);
                } else {
                    setCustomCanonicalUrl(null);
                }
            } catch (error) {
                console.error('Error fetching custom canonical URL:', error);
                setCustomCanonicalUrl(null);
            }
        };

        fetchCustomCanonical();
    }, [store?.id, store?.slug, window.location.pathname]);

    useEffect(() => {
        // Don't proceed if we don't have store data yet
        if (!store || !store.id) {
            return;
        }

        
        // Apply SEO settings defaults with template replacement
        const applyTemplate = (template, data = {}) => {
            if (!template) return '';
            
            let result = template;
            
            // Extract relative path without store-specific prefix
            const absolutePath = window.location.pathname || '';
            let relativePath = absolutePath;
            
            // Remove store-specific prefix like /public/hamid2 to get the actual content path
            if (store?.slug) {
                const storePrefix = `/public/${store.slug}`;
                if (absolutePath.startsWith(storePrefix)) {
                    relativePath = absolutePath.substring(storePrefix.length) || '/';
                }
            }
            
            // Replace common placeholders
            const replacements = {
                '{{store_name}}': store?.name || '',
                '{{page_title}}': pageTitle || '',
                '{{product_name}}': data?.name || '',
                '{{category_name}}': data?.name || '',
                '{{product_description}}': data?.description || data?.short_description || '',
                '{{category_description}}': data?.description || '',
                '{{store_description}}': store?.description || '',
                '{{base_url}}': window.location.origin || '',
                '{{current_url}}': window.location.href || '',
                '{{absolute_path}}': absolutePath,
                '{{relative_path}}': relativePath,
                '{{language_code}}': data?.language_code || '',
                '{{site_name}}': store?.name || '',
                '{{year}}': new Date().getFullYear().toString(),
                '{{currency}}': store?.currency || 'No Currency'
            };
            
            
            // Simple string replacement without regex complications
            Object.entries(replacements).forEach(([placeholder, value]) => {
                // Replace double curly braces version
                while (result.includes(placeholder)) {
                    result = result.replace(placeholder, value);
                }
                
                // Also replace single curly braces version (e.g., {store_name})
                const singleBracePlaceholder = placeholder.replace(/{{/g, '{').replace(/}}/g, '}');
                while (result.includes(singleBracePlaceholder)) {
                    result = result.replace(singleBracePlaceholder, value);
                }
            });
            
            return result.trim();
        };

        // Get default SEO settings values
        const seoDefaultTitle = seoSettings?.default_meta_title || '';
        const seoDefaultDescription = seoSettings?.default_meta_description || '';
        const seoDefaultKeywords = seoSettings?.default_meta_keywords || '';

        // Apply templates to get processed defaults
        const processedDefaultTitle = applyTemplate(seoDefaultTitle, pageData);
        const processedDefaultDescription = applyTemplate(seoDefaultDescription, pageData);
        const processedDefaultKeywords = applyTemplate(seoDefaultKeywords, pageData);

        // Find matching SEO template
        const findMatchingSeoTemplate = (templateType) => {
            if (!seoTemplates || !Array.isArray(seoTemplates) || seoTemplates.length === 0) {
                return null;
            }

            // Filter templates by type and active status
            const relevantTemplates = seoTemplates.filter(template => 
                template.type === templateType && 
                template.is_active !== false
            );

            if (relevantTemplates.length === 0) {
                return null;
            }

            // Find template that matches current conditions
            for (const template of relevantTemplates) {
                if (!template.conditions) {
                    // Template with no conditions matches all
                    return template;
                }

                let matches = true;

                // Check category conditions
                if (template.conditions.categories && 
                    Array.isArray(template.conditions.categories) && 
                    template.conditions.categories.length > 0) {
                    
                    const pageCategories = pageData?.category_ids || pageData?.categories || [];
                    
                    const hasMatchingCategory = template.conditions.categories.some(conditionCat => 
                        pageCategories.includes(conditionCat)
                    );
                    
                    if (!hasMatchingCategory) {
                        matches = false;
                    }
                }

                // Check attribute set conditions
                if (matches && 
                    template.conditions.attribute_sets && 
                    Array.isArray(template.conditions.attribute_sets) && 
                    template.conditions.attribute_sets.length > 0) {
                    
                    const pageAttributeSetId = pageData?.attribute_set_id;
                    const hasMatchingAttributeSet = template.conditions.attribute_sets.includes(pageAttributeSetId);
                    
                    if (!hasMatchingAttributeSet) {
                        matches = false;
                    }
                }

                if (matches) {
                    return template;
                }
            }

            // If no specific template matched, return the first template without conditions
            return relevantTemplates.find(template => !template.conditions || 
                (!template.conditions.categories?.length && !template.conditions.attribute_sets?.length)
            ) || null;
        };

        // Get matching templates for current page type
        const currentPageType = pageType === 'product' ? 'product' : 
                               pageType === 'category' ? 'category' : null;
        
        const matchingTemplate = currentPageType ? findMatchingSeoTemplate(currentPageType) : null;

        // Apply templates to get processed template values
        const templateTitle = matchingTemplate?.meta_title ? 
            applyTemplate(matchingTemplate.meta_title, pageData) : '';
        const templateDescription = matchingTemplate?.meta_description ? 
            applyTemplate(matchingTemplate.meta_description, pageData) : '';
        const templateKeywords = matchingTemplate?.meta_keywords ? 
            applyTemplate(matchingTemplate.meta_keywords, pageData) : '';
        const templateOgTitle = matchingTemplate?.og_title ? 
            applyTemplate(matchingTemplate.og_title, pageData) : '';
        const templateOgDescription = matchingTemplate?.og_description ? 
            applyTemplate(matchingTemplate.og_description, pageData) : '';

        // Fallback to basic defaults if SEO settings don't provide them
        const basicDefaultTitle = store?.name ? `${pageTitle} | ${store.name}` : pageTitle;
        const basicDefaultDescription = pageDescription || store?.description || `Welcome to ${store?.name || 'our store'}. Discover quality products and excellent service.`;

        // Final values with priority: page data > SEO templates > SEO defaults > basic defaults
        const title = pageData?.meta_title || 
                     pageData?.seo?.meta_title || 
                     templateTitle ||
                     processedDefaultTitle || 
                     basicDefaultTitle;
                     
        const description = pageData?.meta_description || 
                           pageData?.seo?.meta_description || 
                           templateDescription ||
                           processedDefaultDescription || 
                           basicDefaultDescription;
                           
        const keywords = pageData?.meta_keywords || 
                        pageData?.seo?.meta_keywords || 
                        templateKeywords ||
                        processedDefaultKeywords || 
                        `${store?.name}, products, quality, shopping`;

        // Default description for structured data
        const defaultDescription = description || store?.description || 'Quality products and services';


        // Determine the robots tag - check SEO settings and robots.txt rules
        let robotsTag = pageData?.meta_robots_tag || 
                       pageData?.seo?.meta_robots_tag;
        
        // If no page-specific robots tag, check robots.txt content for current page
        if (!robotsTag) {
            const robotsContent = seoSettings?.robots_txt_content || '';
            const currentPath = window.location.pathname;
            
            
            // Check if current path matches any Disallow rules
            let shouldDisallow = false;
            if (robotsContent && robotsContent.trim()) {
                const disallowRules = robotsContent.match(/Disallow:\s*([^\n\r]*)/g) || [];
                
                for (const rule of disallowRules) {
                    const path = rule.replace('Disallow:', '').trim();
                    
                    if (path && path !== '/' && path !== '') {
                        // More precise matching logic - check if the current path contains or matches the disallow pattern
                        const pathMatches = currentPath === path || 
                                          currentPath.startsWith(path) ||
                                          currentPath.includes(path) ||
                                          (path.endsWith('/') && (currentPath.startsWith(path) || currentPath.includes(path)));
                        
                        
                        if (pathMatches) {
                            shouldDisallow = true;
                            break;
                        }
                    }
                }
            }
            
            
            robotsTag = shouldDisallow ? 'noindex, nofollow' : (seoSettings?.default_meta_robots || 'index, follow');
        }

        const ogImage = imageUrl ||
                       pageData?.images?.[0] ||
                       seoSettings?.social_media_settings?.open_graph?.default_image_url ||
                       seoSettings?.open_graph_settings?.default_image_url ||
                       store?.logo_url;


        // Update document title
        document.title = title;

        // Function to update or create meta tag
        const updateMetaTag = (name, content, property = false, allowEmpty = false) => {
            // Allow empty content for certain critical tags
            if (!content && !allowEmpty) {
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
            
            metaTag.setAttribute('content', content || '');
        };

        // Update basic meta tags
        updateMetaTag('description', description);
        if (keywords) updateMetaTag('keywords', keywords);
        updateMetaTag('robots', robotsTag);

        // Canonical URL with template replacement
        // Priority: Custom canonical URL from database > pageData > canonical_base_url > current URL
        let canonicalUrl = customCanonicalUrl || pageData?.canonical_url;

        if (!canonicalUrl) {
            // Apply template replacement to canonical base URL
            const canonicalBase = applyTemplate(seoSettings?.canonical_base_url || '', pageData);

            if (canonicalBase && canonicalBase.trim()) {
                // Ensure the base URL doesn't end with / and pathname starts with /
                const cleanBase = canonicalBase.replace(/\/$/, '');
                const cleanPath = window.location.pathname.startsWith('/')
                    ? window.location.pathname
                    : '/' + window.location.pathname;
                canonicalUrl = `${cleanBase}${cleanPath}`;
            } else {
                canonicalUrl = window.location.href;
            }
        }

        // Apply template replacement to the final canonical URL (unless it's a custom canonical URL which should be used as-is)
        if (!customCanonicalUrl) {
            canonicalUrl = applyTemplate(canonicalUrl, pageData);
        }
        
        
        // Update or create canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonicalUrl);

        // Hreflang tags

        if (seoSettings?.hreflang_settings && Array.isArray(seoSettings.hreflang_settings) && seoSettings.hreflang_settings.length > 0) {
            // Remove existing hreflang tags
            const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
            existingHreflangs.forEach(link => link.remove());

            // Add new hreflang tags
            seoSettings.hreflang_settings.forEach(hreflang => {
                if (hreflang.is_active && hreflang.language_code && hreflang.url_pattern) {
                    const hreflangUrl = applyTemplate(hreflang.url_pattern, {
                        current_url: window.location.href,
                        current_path: window.location.pathname,
                        language_code: hreflang.language_code,
                        ...pageData
                    });

                    if (hreflangUrl) {
                        const hreflangLink = document.createElement('link');
                        hreflangLink.setAttribute('rel', 'alternate');
                        hreflangLink.setAttribute('hreflang',
                            hreflang.country_code ?
                                `${hreflang.language_code}-${hreflang.country_code}` :
                                hreflang.language_code
                        );
                        hreflangLink.setAttribute('href', hreflangUrl);
                        document.head.appendChild(hreflangLink);
                    }
                }
            });
        }

        // Open Graph Tags (always enabled, controlled via settings)
        if (true) {
            // Use Open Graph specific template values if available, otherwise fall back to regular meta values
            const ogTitle = pageData?.og_title || 
                           pageData?.seo?.og_title || 
                           templateOgTitle ||
                           title;
            const ogDescription = pageData?.og_description || 
                                 pageData?.seo?.og_description || 
                                 templateOgDescription ||
                                 description;
            
            updateMetaTag('og:title', ogTitle, true);
            updateMetaTag('og:description', ogDescription, true);
            updateMetaTag('og:type', pageType === 'product' ? 'product' : 'website', true);
            if (ogImage) {
                updateMetaTag('og:image', ogImage, true);
                updateMetaTag('og:image:alt', `${title} - ${store.name}`, true);
            }
            if (store?.name) updateMetaTag('og:site_name', store.name, true);
            updateMetaTag('og:url', window.location.href, true);
            
            // Facebook App ID if provided
            const fbAppId = seoSettings?.social_media_settings?.open_graph?.facebook_app_id ||
                           seoSettings?.open_graph_settings?.facebook_app_id;
            if (fbAppId) {
                updateMetaTag('fb:app_id', fbAppId, true);
            }
        }

        // Twitter Card Tags (always enabled, controlled via settings)
        if (true) {
            const cardType = seoSettings?.social_media_settings?.twitter?.card_type ||
                            seoSettings?.twitter_card_settings?.card_type ||
                            'summary_large_image';
            updateMetaTag('twitter:card', cardType);
            updateMetaTag('twitter:title', title);
            updateMetaTag('twitter:description', description);
            if (ogImage) {
                updateMetaTag('twitter:image', ogImage);
                updateMetaTag('twitter:image:alt', `${title} - ${store.name}`);
            }
            
            // Twitter site username if provided
            const twitterSiteUsername = seoSettings?.social_media_settings?.twitter?.site_username ||
                                       seoSettings?.twitter_card_settings?.site_username;
            if (twitterSiteUsername) {
                const username = twitterSiteUsername.startsWith('@')
                    ? twitterSiteUsername
                    : `@${twitterSiteUsername}`;
                updateMetaTag('twitter:site', username);
            }
        }

        // Rich Snippets / Schema.org (always enabled, controlled via individual schema settings)

        // Product-specific Schema.org structured data
        if (pageType === 'product' && pageData) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="product"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableProductSchema = seoSettings?.social_media_settings?.schema?.enable_product_schema ??
                                       seoSettings?.schema_settings?.enable_product_schema ??
                                       true;
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
                        "name": seoSettings?.social_media_settings?.schema?.organization_name ||
                               seoSettings?.schema_settings?.organization_name ||
                               store?.name || "Store"
                    },
                    "offers": {
                        "@type": "Offer",
                        "url": window.location.href,
                        "priceCurrency": store?.currency || "No Currency",
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
        if (pageType !== 'product' && store) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableOrgSchema = seoSettings?.social_media_settings?.schema?.enable_organization_schema ??
                                   seoSettings?.schema_settings?.enable_organization_schema ??
                                   true;
            if (enableOrgSchema) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.setAttribute('data-type', 'organization');
                
                const structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": seoSettings?.social_media_settings?.schema?.organization_name ||
                           seoSettings?.schema_settings?.organization_name ||
                           store.name,
                    "description": store.description || defaultDescription,
                    "url": window.location.origin
                };

                // Add logo if provided
                const orgLogoUrl = seoSettings?.social_media_settings?.schema?.organization_logo_url ||
                                  seoSettings?.schema_settings?.organization_logo_url;
                if (orgLogoUrl) {
                    structuredData.logo = orgLogoUrl;
                }

                // Add social profiles from new consolidated structure
                let socialProfiles = [];
                if (seoSettings?.social_media_settings?.social_profiles) {
                    const profiles = seoSettings.social_media_settings.social_profiles;
                    socialProfiles = Object.values(profiles)
                        .filter(url => url && typeof url === 'string' && url.trim())
                        .concat(Array.isArray(profiles.other) ? profiles.other.filter(url => url && url.trim()) : []);
                }
                // Fallback to legacy social_profiles array
                else if (seoSettings?.schema_settings?.social_profiles && Array.isArray(seoSettings.schema_settings.social_profiles)) {
                    socialProfiles = seoSettings.schema_settings.social_profiles.filter(profile => profile && profile.trim());
                }

                // Add social profiles to structured data if any exist
                if (socialProfiles.length > 0) {
                    structuredData.sameAs = socialProfiles;
                }

                script.textContent = JSON.stringify(structuredData);
                document.head.appendChild(script);
            }
        }

        // Website structured data for homepage
        if (pageType === 'homepage' && store) {
            
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

        // Google Tag Manager Implementation
        const analyticsSettings = store?.settings?.analytics_settings;
        
        // Always clean up existing GTM scripts first
        const cleanupGTM = () => {
            // Remove all GTM-related scripts and elements
            document.querySelectorAll('script[data-gtm]').forEach(el => el.remove());
            document.querySelectorAll('noscript[data-gtm]').forEach(el => el.remove());
            document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach(el => el.remove());
        };
        
        cleanupGTM();
        
        if (analyticsSettings?.enable_google_tag_manager) {
            if (analyticsSettings.gtm_script_type === 'custom' && analyticsSettings.custom_gtm_script) {
                // Custom GTM Script (Server-Side Tagging)
                const script = document.createElement('script');
                script.setAttribute('data-gtm', 'head-custom');
                script.innerHTML = analyticsSettings.custom_gtm_script;
                document.head.appendChild(script);

                // Add noscript fallback to body for custom scripts
                if (analyticsSettings.gtm_id) {
                    const noscript = document.createElement('noscript');
                    noscript.setAttribute('data-gtm', 'body-noscript-custom');
                    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${analyticsSettings.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
                    document.body.insertBefore(noscript, document.body.firstChild);
                }
            } else if (analyticsSettings.gtm_script_type === 'default' && analyticsSettings.gtm_id) {
                // Standard GTM Implementation
                const script = document.createElement('script');
                script.setAttribute('data-gtm', 'head-default');
                script.innerHTML = `
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${analyticsSettings.gtm_id}');
                `;
                document.head.appendChild(script);

                // Add noscript fallback to body
                const noscript = document.createElement('noscript');
                noscript.setAttribute('data-gtm', 'body-noscript');
                noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${analyticsSettings.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
                document.body.insertBefore(noscript, document.body.firstChild);
            }
        }

        // Google Ads Conversion Tracking
        // Always clean up existing Google Ads scripts first
        const cleanupGoogleAds = () => {
            document.querySelectorAll('script[data-google-ads]').forEach(el => el.remove());
            document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(el => el.remove());
        };
        
        cleanupGoogleAds();
        
        if (analyticsSettings?.google_ads_id) {
            const script = document.createElement('script');
            script.setAttribute('data-google-ads', 'head');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsSettings.google_ads_id}`;
            document.head.appendChild(script);

            const configScript = document.createElement('script');
            configScript.setAttribute('data-google-ads', 'config');
            configScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsSettings.google_ads_id}');
            `;
            document.head.appendChild(configScript);
        }

        // Cleanup function
        return () => {
            // Cleanup analytics scripts when component unmounts or store changes
            document.querySelectorAll('script[data-gtm]').forEach(el => el.remove());
            document.querySelectorAll('noscript[data-gtm]').forEach(el => el.remove());
            document.querySelectorAll('script[data-google-ads]').forEach(el => el.remove());
            document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach(el => el.remove());
            document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(el => el.remove());
        };
    }, [pageType, pageData, pageTitle, pageDescription, imageUrl, store, seoSettings, seoTemplates, customCanonicalUrl]);

    return null;
}