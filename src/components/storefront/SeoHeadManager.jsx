import React, { useEffect } from 'react';
import { useStore } from './StoreProvider';

export default function SeoHeadManager({ pageType, pageData, pageTitle, pageDescription, imageUrl }) {
    const { store, seoSettings, seoTemplates } = useStore();

    useEffect(() => {
        // Don't proceed if we don't have store data yet
        if (!store || !store.id) {
            return;
        }

        
        // Apply SEO settings defaults with template replacement
        const applyTemplate = (template, data = {}) => {
            if (!template) return '';
            
            let result = template;
            
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
                '{{current_path}}': window.location.pathname || '',
                '{{site_name}}': store?.name || '',
                '{{year}}': new Date().getFullYear().toString(),
                '{{currency}}': store?.currency || 'USD'
            };
            
            console.log('🔍 Template replacement:', {
                original: template,
                store: store?.name,
                pageData: data
            });
            
            // Simple string replacement without regex complications
            Object.entries(replacements).forEach(([placeholder, value]) => {
                // Replace double curly braces version
                while (result.includes(placeholder)) {
                    result = result.replace(placeholder, value);
                    console.log(`🔄 Replaced ${placeholder} with "${value}"`);
                }
                
                // Also replace single curly braces version (e.g., {store_name})
                const singleBracePlaceholder = placeholder.replace(/{{/g, '{').replace(/}}/g, '}');
                while (result.includes(singleBracePlaceholder)) {
                    result = result.replace(singleBracePlaceholder, value);
                    console.log(`🔄 Replaced ${singleBracePlaceholder} with "${value}"`);
                }
            });
            
            console.log('🔍 Template result:', result);
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

        // Fallback to basic defaults if SEO settings don't provide them
        const basicDefaultTitle = store?.name ? `${pageTitle} | ${store.name}` : pageTitle;
        const basicDefaultDescription = pageDescription || store?.description || `Welcome to ${store?.name || 'our store'}. Discover quality products and excellent service.`;

        // Final values with priority: page data > SEO templates > SEO defaults > basic defaults
        const title = pageData?.meta_title || 
                     pageData?.seo?.meta_title || 
                     processedDefaultTitle || 
                     basicDefaultTitle;
                     
        const description = pageData?.meta_description || 
                           pageData?.seo?.meta_description || 
                           processedDefaultDescription || 
                           basicDefaultDescription;
                           
        const keywords = pageData?.meta_keywords || 
                        pageData?.seo?.meta_keywords || 
                        processedDefaultKeywords || 
                        `${store?.name}, products, quality, shopping`;

        // Default description for structured data
        const defaultDescription = description || store?.description || 'Quality products and services';

        // Debug logging (remove in production)
        console.log('🔍 SEO Debug:', {
            pageTitle,
            pageDescription,
            store: store?.name,
            seoSettings: seoSettings ? 'loaded' : 'not loaded',
            seoSettingsData: seoSettings,
            'enable_rich_snippets type': typeof seoSettings?.enable_rich_snippets,
            'enable_rich_snippets value': seoSettings?.enable_rich_snippets,
            'enable_open_graph type': typeof seoSettings?.enable_open_graph,
            'enable_open_graph value': seoSettings?.enable_open_graph,
            'enable_twitter_cards type': typeof seoSettings?.enable_twitter_cards,
            'enable_twitter_cards value': seoSettings?.enable_twitter_cards,
            seoDefaultTitle,
            seoDefaultDescription,
            seoDefaultKeywords,
            finalTitle: title,
            finalDescription: description,
            finalKeywords: keywords
        });

        // Determine the robots tag - check SEO settings and robots.txt rules
        let robotsTag = pageData?.meta_robots_tag || 
                       pageData?.seo?.meta_robots_tag;
        
        // If no page-specific robots tag, check robots.txt content for current page
        if (!robotsTag) {
            const robotsContent = seoSettings?.robots_txt_content || '';
            const currentPath = window.location.pathname;
            
            console.log('🔍 Robots check:', {
                currentPath,
                'robots content exists': !!robotsContent,
                'robots content length': robotsContent?.length || 0,
                'robots preview': robotsContent?.substring(0, 100) + (robotsContent?.length > 100 ? '...' : '')
            });
            
            // Check if current path matches any Disallow rules
            let shouldDisallow = false;
            if (robotsContent && robotsContent.trim()) {
                console.log('🔍 Processing robots.txt content:', robotsContent);
                const disallowRules = robotsContent.match(/Disallow:\s*([^\n\r]*)/g) || [];
                console.log('🔍 Found disallow rules:', disallowRules);
                
                for (const rule of disallowRules) {
                    const path = rule.replace('Disallow:', '').trim();
                    console.log('🔍 Checking rule path:', `"${path}"`, 'against current path:', `"${currentPath}"`);
                    
                    if (path && path !== '/' && path !== '') {
                        // More precise matching logic - check if the current path contains or matches the disallow pattern
                        const pathMatches = currentPath === path || 
                                          currentPath.startsWith(path) ||
                                          currentPath.includes(path) ||
                                          (path.endsWith('/') && (currentPath.startsWith(path) || currentPath.includes(path)));
                        
                        console.log('🔍 Path match result:', pathMatches, {
                            'exact match': currentPath === path,
                            'starts with': currentPath.startsWith(path),
                            'includes': currentPath.includes(path)
                        });
                        
                        if (pathMatches) {
                            shouldDisallow = true;
                            console.log('🚫 MATCH! Disallow rule:', `"${path}"`, 'matches current path:', `"${currentPath}"`);
                            break;
                        }
                    }
                }
            }
            
            console.log('🔍 shouldDisallow final result:', shouldDisallow);
            console.log('🔍 seoSettings?.default_meta_robots:', seoSettings?.default_meta_robots);
            
            robotsTag = shouldDisallow ? 'noindex, nofollow' : (seoSettings?.default_meta_robots || 'index, follow');
            console.log('🔍 Final robots tag result:', robotsTag);
        }

        const ogImage = imageUrl || 
                       pageData?.images?.[0] || 
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
        let canonicalUrl = pageData?.canonical_url;
        
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
        
        // Apply template replacement to the final canonical URL
        canonicalUrl = applyTemplate(canonicalUrl, pageData);
        
        console.log('🔍 Canonical URL check:', {
            'seoSettings?.canonical_base_url': seoSettings?.canonical_base_url,
            'processed canonical base': applyTemplate(seoSettings?.canonical_base_url || '', pageData),
            'window.location.pathname': window.location.pathname,
            'finalCanonicalUrl': canonicalUrl
        });
        
        // Update or create canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonicalUrl);

        // Hreflang tags
        console.log('🔍 Hreflang check:', {
            'seoSettings?.hreflang_settings': seoSettings?.hreflang_settings,
            'isArray': Array.isArray(seoSettings?.hreflang_settings),
            'length': seoSettings?.hreflang_settings?.length
        });
        
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

        // Open Graph Tags (check if enabled)
        const enableOpenGraph = seoSettings?.enable_open_graph === true;
        console.log('🔍 Open Graph check:', {
            'seoSettings?.enable_open_graph': seoSettings?.enable_open_graph,
            'enableOpenGraph': enableOpenGraph
        });
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
            console.log('✅ Added Open Graph meta tags to page');
        }

        // Twitter Card Tags (check if enabled)
        const enableTwitterCards = seoSettings?.enable_twitter_cards === true;
        console.log('🔍 Twitter Cards check:', {
            'seoSettings?.enable_twitter_cards': seoSettings?.enable_twitter_cards,
            'enableTwitterCards': enableTwitterCards
        });
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
            console.log('✅ Added Twitter Card meta tags to page');
        }

        // Rich Snippets / Schema.org (check if enabled)
        const enableRichSnippets = seoSettings?.enable_rich_snippets === true;
        console.log('🔍 Rich Snippets check:', {
            'seoSettings?.enable_rich_snippets': seoSettings?.enable_rich_snippets,
            'enableRichSnippets': enableRichSnippets
        });
        
        // Product-specific Schema.org structured data
        if (enableRichSnippets && pageType === 'product' && pageData) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="product"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableProductSchema = seoSettings?.schema_settings?.enable_product_schema === true;
            console.log('🔍 Product Schema check:', {
                'seoSettings?.schema_settings?.enable_product_schema': seoSettings?.schema_settings?.enable_product_schema,
                'enableProductSchema': enableProductSchema
            });
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
                console.log('✅ Added Product Schema structured data to page');
            }
        }

        // Organization structured data for non-product pages
        if (enableRichSnippets && pageType !== 'product' && store) {
            
            // Remove existing schema first
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-type="organization"]');
            if (existingSchema) {
                existingSchema.remove();
            }
            
            const enableOrgSchema = seoSettings?.schema_settings?.enable_organization_schema === true;
            console.log('🔍 Organization Schema check:', {
                'seoSettings?.schema_settings?.enable_organization_schema': seoSettings?.schema_settings?.enable_organization_schema,
                'enableOrgSchema': enableOrgSchema
            });
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
                console.log('✅ Added Organization Schema structured data to page');
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
            console.log('✅ Added Website Schema structured data to page');
        }


        // Cleanup function
        return () => {
        };
    }, [pageType, pageData, pageTitle, pageDescription, imageUrl, store, seoSettings, seoTemplates]);

    return null;
}