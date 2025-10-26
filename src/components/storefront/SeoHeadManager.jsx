import React, { useEffect, useState } from 'react';
import { useStore } from './StoreProvider';
import { useSeoSettings } from './SeoSettingsProvider';
import apiClient from '@/api/client';
import { getPriceDisplay, formatPrice } from '@/utils/priceUtils';
import { getCategoryName, getProductName, getCurrentLanguage } from '@/utils/translationUtils';

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

        /**
         * SEO PRIORITY CASCADE SYSTEM
         * ===========================
         *
         * This component implements a 5-level priority cascade for SEO metadata:
         *
         * 1. ENTITY-SPECIFIC OVERRIDES (Highest Priority)
         *    - product.meta_title, product.og_title, etc.
         *    - category.meta_title, category.og_title, etc.
         *    - cms_page.meta_title, cms_page.og_title, etc.
         *
         * 2. CONDITIONAL PAGE TYPE TEMPLATES
         *    - Templates with specific conditions (e.g., products in "Electronics" category)
         *    - Matched by type and conditions (categories, attribute_sets)
         *
         * 3. GENERIC PAGE TYPE TEMPLATES
         *    - Templates without conditions (e.g., all product pages)
         *    - Matched by type only
         *
         * 4. GLOBAL SEO DEFAULTS
         *    - Site-wide default settings from seoSettings
         *    - Includes Open Graph and Twitter defaults
         *
         * 5. AUTOMATIC FALLBACKS (Lowest Priority)
         *    - Generated from entity data and store information
         *    - E.g., "{product.name} | {store.name}"
         */

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
            const titleSeparator = seoSettings?.title_separator || '|';
            const currentLang = getCurrentLanguage();

            // Get translated names if available
            const productName = pageType === 'product' && data ?
                (getProductName(data, currentLang) || data?.name || '') :
                (data?.name || '');
            const categoryName = pageType === 'category' && data ?
                (getCategoryName(data, currentLang) || data?.name || '') :
                (data?.name || '');

            const replacements = {
                '{{store_name}}': store?.name || '',
                '{{page_title}}': pageTitle || '',
                '{{product_name}}': productName,
                '{{category_name}}': categoryName,
                '{{product_description}}': data?.description || data?.short_description || '',
                '{{category_description}}': data?.description || '',
                '{{store_description}}': store?.description || '',
                '{{base_url}}': window.location.origin || '',
                '{{current_url}}': window.location.href || '',
                '{{absolute_path}}': absolutePath,
                '{{relative_path}}': relativePath,
                '{{language_code}}': currentLang || data?.language_code || '',
                '{{site_name}}': store?.name || '',
                '{{separator}}': titleSeparator,
                '{{year}}': new Date().getFullYear().toString(),
                '{{month}}': new Date().toLocaleString('default', { month: 'long' }),
                '{{day}}': new Date().getDate().toString(),
                '{{currency}}': store?.currency || 'No Currency',
                '{{sku}}': data?.sku || '',
                '{{price}}': data?.price ? formatPrice(data.price, store?.currency) : '',
                '{{brand}}': data?.brand || ''
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

        // Get default SEO settings values from consolidated JSON
        const defaultMetaSettings = seoSettings?.default_meta_settings || {};
        const seoDefaultTitle = defaultMetaSettings.meta_title || '';
        const seoDefaultDescription = defaultMetaSettings.meta_description || '';
        const seoDefaultKeywords = seoSettings?.meta_keywords || defaultMetaSettings.meta_keywords || '';

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
        // Map page types to template types
        const templateTypeMap = {
            'product': 'product',
            'category': 'category',
            'cms_page': 'cms_page',
            'homepage': 'homepage',
            'blog_post': 'blog_post',
            'brand': 'brand'
        };

        const currentPageType = templateTypeMap[pageType] || null;
        const matchingTemplate = currentPageType ? findMatchingSeoTemplate(currentPageType) : null;

        // Apply templates to get processed template values (from JSON)
        const templateTitle = matchingTemplate?.template?.meta_title ?
            applyTemplate(matchingTemplate.template.meta_title, pageData) : '';
        const templateDescription = matchingTemplate?.template?.meta_description ?
            applyTemplate(matchingTemplate.template.meta_description, pageData) : '';
        const templateKeywords = matchingTemplate?.template?.meta_keywords ?
            applyTemplate(matchingTemplate.template.meta_keywords, pageData) : '';
        const templateMetaRobots = matchingTemplate?.template?.meta_robots || '';
        const templateOgTitle = matchingTemplate?.template?.og_title ?
            applyTemplate(matchingTemplate.template.og_title, pageData) : '';
        const templateOgDescription = matchingTemplate?.template?.og_description ?
            applyTemplate(matchingTemplate.template.og_description, pageData) : '';
        const templateTwitterTitle = matchingTemplate?.template?.twitter_title ?
            applyTemplate(matchingTemplate.template.twitter_title, pageData) : '';
        const templateTwitterDescription = matchingTemplate?.template?.twitter_description ?
            applyTemplate(matchingTemplate.template.twitter_description, pageData) : '';

        // Fallback to basic defaults if SEO settings don't provide them
        // Use title separator from settings, default to |
        const titleSeparator = seoSettings?.title_separator || '|';
        const basicDefaultTitle = store?.name ? `${pageTitle} ${titleSeparator} ${store.name}` : pageTitle;
        const basicDefaultDescription = pageDescription || store?.description || `Welcome to ${store?.name || 'our store'}. Discover quality products and excellent service.`;

        /**
         * PRIORITY CASCADE: META TAGS
         * ============================
         * Priority order: Entity SEO JSON > Template JSON > Global Default > Fallback
         */

        // All entity SEO data comes from the seo JSON field
        // Apply template processing to ensure variables are replaced
        let title = pageData?.seo?.meta_title ||               // Entity SEO JSON
                     templateTitle ||                            // Template (conditional or generic)
                     processedDefaultTitle ||                    // Global default
                     basicDefaultTitle;                          // Fallback

        // Apply template processing to the final title (in case entity SEO has variables)
        title = applyTemplate(title, pageData);

        let description = pageData?.seo?.meta_description ||   // Entity SEO JSON
                           templateDescription ||                // Template
                           processedDefaultDescription ||        // Global default
                           basicDefaultDescription;              // Fallback

        // Apply template processing to the final description
        description = applyTemplate(description, pageData);

        let keywords = pageData?.seo?.meta_keywords ||         // Entity SEO JSON
                        templateKeywords ||                      // Template
                        processedDefaultKeywords ||              // Global default
                        `${store?.name}, products, quality, shopping`;  // Fallback

        // Apply template processing to the final keywords
        keywords = applyTemplate(keywords, pageData);

        // Default description for structured data
        const defaultDescription = description || store?.description || 'Quality products and services';


        /**
         * PRIORITY CASCADE: ROBOTS TAG
         * =============================
         * Priority: Entity SEO JSON > Template > Global Default > Fallback
         */
        let robotsTag = pageData?.seo?.meta_robots_tag ||        // Entity SEO JSON
                       templateMetaRobots;                       // Template

        // If no page-specific or template robots tag, check robots.txt content for current page
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


            // Use global default meta_robots from settings
            const globalMetaRobots = seoSettings?.meta_robots || defaultMetaSettings.meta_robots || 'index, follow';
            robotsTag = shouldDisallow ? 'noindex, nofollow' : globalMetaRobots;
        }

        // Extract image URL - handle both string URLs and image objects
        const getImageUrl = (img) => {
            if (!img) return null;
            if (typeof img === 'string') return img;
            if (typeof img === 'object') return img.url || img.src || img.image_url || null;
            return null;
        };

        /**
         * PRIORITY CASCADE: OG IMAGE
         * ===========================
         */
        const ogImage = pageData?.seo?.og_image_url ||           // Entity SEO JSON
                       imageUrl ||                              // Passed via prop
                       getImageUrl(pageData?.images?.[0]) ||    // Entity's first image
                       seoSettings?.social_media_settings?.open_graph?.default_image_url ||  // Global OG default
                       seoSettings?.open_graph_settings?.default_image_url ||                // Legacy OG default
                       store?.logo_url;                         // Store logo fallback


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

        /**
         * PRIORITY CASCADE: CANONICAL URL
         * ================================
         * Priority: Custom DB > Entity SEO JSON > Template Base > Current URL
         */
        let canonicalUrl = customCanonicalUrl ||                 // Custom canonical from database
                          pageData?.seo?.canonical_url;          // Entity SEO JSON

        if (!canonicalUrl) {
            // Apply template replacement to canonical base URL from settings
            const canonicalBase = applyTemplate(seoSettings?.canonical_settings?.base_url || '', pageData);

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

        // Declare OG variables outside the block so they can be used by Twitter fallback
        let ogTitle = title;  // Default to meta title
        let ogDescription = description;  // Default to meta description

        // Open Graph Tags (controlled via settings)
        const ogEnabled = seoSettings?.social_media_settings?.open_graph?.enabled !== false;
        if (ogEnabled) {
            // Get default OG values from settings
            const ogDefaultTitle = applyTemplate(
                seoSettings?.social_media_settings?.open_graph?.default_title || '',
                pageData
            );
            const ogDefaultDescription = applyTemplate(
                seoSettings?.social_media_settings?.open_graph?.default_description || '',
                pageData
            );

            /**
             * PRIORITY CASCADE: OPEN GRAPH TAGS
             * ==================================
             * Priority: Entity SEO JSON > Template JSON > Global OG Default > Meta Tag Fallback
             */
            ogTitle = pageData?.seo?.og_title ||               // Entity SEO JSON
                     templateOgTitle ||                        // Template OG
                     ogDefaultTitle ||                         // Global OG default
                     title;                                    // Meta title fallback

            // Apply template processing to OG title
            ogTitle = applyTemplate(ogTitle, pageData);

            ogDescription = pageData?.seo?.og_description ||   // Entity SEO JSON
                           templateOgDescription ||            // Template OG
                           ogDefaultDescription ||             // Global OG default
                           description;                        // Meta description fallback

            // Apply template processing to OG description
            ogDescription = applyTemplate(ogDescription, pageData);

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

            // Facebook Page URL (article:publisher) if provided
            const fbPageUrl = seoSettings?.social_media_settings?.open_graph?.facebook_page_url;
            if (fbPageUrl) {
                updateMetaTag('article:publisher', fbPageUrl, true);
            }
        }

        // Twitter Card Tags (controlled via settings)
        const twitterEnabled = seoSettings?.social_media_settings?.twitter?.enabled !== false;
        if (twitterEnabled) {
            // Get default Twitter values from settings
            const twitterDefaultTitle = applyTemplate(
                seoSettings?.social_media_settings?.twitter?.default_title || '',
                pageData
            );
            const twitterDefaultDescription = applyTemplate(
                seoSettings?.social_media_settings?.twitter?.default_description || '',
                pageData
            );

            /**
             * PRIORITY CASCADE: TWITTER CARD TAGS
             * ====================================
             * Priority: Entity SEO JSON > Template JSON > Global Twitter Default > OG Fallback > Meta Fallback
             */
            let twitterTitle = pageData?.seo?.twitter_title ||         // Entity SEO JSON
                                templateTwitterTitle ||                   // Template Twitter
                                twitterDefaultTitle ||                    // Global Twitter default
                                ogTitle ||                                // OG title fallback
                                title;                                    // Meta title fallback

            // Apply template processing to Twitter title
            twitterTitle = applyTemplate(twitterTitle, pageData);

            let twitterDescription = pageData?.seo?.twitter_description || // Entity SEO JSON
                                      templateTwitterDescription ||       // Template Twitter
                                      twitterDefaultDescription ||        // Global Twitter default
                                      ogDescription ||                    // OG description fallback
                                      description;                        // Meta description fallback

            // Apply template processing to Twitter description
            twitterDescription = applyTemplate(twitterDescription, pageData);

            /**
             * PRIORITY CASCADE: TWITTER IMAGE
             * ================================
             */
            const twitterImage = pageData?.seo?.twitter_image_url ||    // Entity SEO JSON
                                ogImage;                                // Fallback to OG image

            const cardType = seoSettings?.social_media_settings?.twitter?.card_type ||
                            seoSettings?.twitter_card_settings?.card_type ||
                            'summary_large_image';
            updateMetaTag('twitter:card', cardType);
            updateMetaTag('twitter:title', twitterTitle);
            updateMetaTag('twitter:description', twitterDescription);
            if (twitterImage) {
                updateMetaTag('twitter:image', twitterImage);
                updateMetaTag('twitter:image:alt', `${twitterTitle} - ${store.name}`);
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

            // Twitter creator username if provided
            const twitterCreatorUsername = seoSettings?.social_media_settings?.twitter?.creator_username;
            if (twitterCreatorUsername) {
                const creatorUsername = twitterCreatorUsername.startsWith('@')
                    ? twitterCreatorUsername
                    : `@${twitterCreatorUsername}`;
                updateMetaTag('twitter:creator', creatorUsername);
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

                // Get correct pricing using priceUtils
                const priceInfo = getPriceDisplay(pageData);
                const actualPrice = priceInfo.displayPrice; // Use the selling price (discounted if applicable)

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
                        "price": actualPrice,
                        "availability": (pageData.stock_quantity > 0 || pageData.infinite_stock) ?
                            "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                    }
                };

                // Add price specification if there's a discount
                if (priceInfo.hasComparePrice && priceInfo.originalPrice) {
                    structuredData.offers.priceSpecification = {
                        "@type": "PriceSpecification",
                        "price": actualPrice,
                        "priceCurrency": store?.currency || "No Currency"
                    };
                    // Add the original (higher) price for reference
                    structuredData.offers.priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
                }

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

                const schemaSettings = seoSettings?.social_media_settings?.schema || seoSettings?.schema_settings || {};

                const structuredData = {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": schemaSettings.organization_name || store.name,
                    "description": schemaSettings.organization_description || store.description || defaultDescription,
                    "url": window.location.origin
                };

                // Add logo if provided
                const orgLogoUrl = schemaSettings.organization_logo_url;
                if (orgLogoUrl) {
                    structuredData.logo = orgLogoUrl;
                }

                // Add founding date if provided
                if (schemaSettings.founded_year) {
                    structuredData.foundingDate = schemaSettings.founded_year.toString();
                }

                // Add founder if provided
                if (schemaSettings.founder_name) {
                    structuredData.founder = {
                        "@type": "Person",
                        "name": schemaSettings.founder_name
                    };
                }

                // Add price range if provided
                if (schemaSettings.price_range) {
                    structuredData.priceRange = schemaSettings.price_range;
                }

                // Add contact point if contact info is provided
                if (schemaSettings.contact_telephone || schemaSettings.contact_email) {
                    structuredData.contactPoint = {
                        "@type": "ContactPoint",
                        "contactType": schemaSettings.contact_type || "customer service"
                    };

                    if (schemaSettings.contact_telephone) {
                        structuredData.contactPoint.telephone = schemaSettings.contact_telephone;
                    }

                    if (schemaSettings.contact_email) {
                        structuredData.contactPoint.email = schemaSettings.contact_email;
                    }
                }

                // Add social profiles from new consolidated structure (only if enabled)
                const enableSocialProfiles = schemaSettings.enable_social_profiles !== false;
                if (enableSocialProfiles) {
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

        // Breadcrumb structured data
        const enableBreadcrumbSchema = seoSettings?.social_media_settings?.schema?.enable_breadcrumb_schema !== false;
        if (enableBreadcrumbSchema && pageData?.breadcrumbs && Array.isArray(pageData.breadcrumbs) && pageData.breadcrumbs.length > 0) {

            // Remove existing breadcrumb schema first
            const existingBreadcrumb = document.querySelector('script[type="application/ld+json"][data-type="breadcrumb"]');
            if (existingBreadcrumb) {
                existingBreadcrumb.remove();
            }

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-type', 'breadcrumb');

            const breadcrumbItems = pageData.breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name || crumb.label || crumb.title,
                "item": crumb.url || crumb.href || window.location.href
            }));

            const structuredData = {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbItems
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