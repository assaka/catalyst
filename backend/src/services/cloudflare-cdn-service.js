const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const CloudflareOAuthService = require('./cloudflare-oauth-service');

class CloudflareCDNService {
  constructor(config = {}) {
    this.zoneId = config.zoneId || process.env.CLOUDFLARE_ZONE_ID;
    this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN;
    this.cdnDomain = config.cdnDomain || process.env.CLOUDFLARE_CDN_DOMAIN;
    this.enabled = config.enabled !== false && process.env.ENABLE_CLOUDFLARE_CDN !== 'false';
    this.storeId = config.storeId;
    
    // Initialize OAuth service
    this.oauthService = new CloudflareOAuthService(config.oauth);
    
    // Image transformation settings
    this.imageFormats = ['webp', 'avif', 'jpg', 'png'];
    this.imageSizes = {
      thumbnail: { width: 150, height: 150, fit: 'crop' },
      small: { width: 300, height: 300, fit: 'scale-down' },
      medium: { width: 500, height: 500, fit: 'scale-down' },
      large: { width: 1200, height: 1200, fit: 'scale-down' }
    };
    
    console.log('🌐 CloudflareCDNService initialized with:');
    console.log('  CDN Enabled:', this.enabled);
    console.log('  CDN Domain:', this.cdnDomain);
    console.log('  Zone ID present:', !!this.zoneId);
    console.log('  API Token present:', !!this.apiToken);
  }

  /**
   * Validate CDN configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.enabled) {
      return ['CDN is disabled'];
    }
    
    if (!this.cdnDomain) {
      errors.push('CLOUDFLARE_CDN_DOMAIN is required');
    }
    
    if (!this.zoneId) {
      errors.push('CLOUDFLARE_ZONE_ID is required for advanced features');
    }
    
    if (!this.apiToken) {
      errors.push('CLOUDFLARE_API_TOKEN is required for zone management');
    }
    
    return errors;
  }

  /**
   * Transform Akeneo image URL to use Cloudflare CDN
   */
  transformImageUrl(originalUrl, options = {}) {
    if (!this.enabled || !this.cdnDomain) {
      return originalUrl;
    }

    try {
      const url = new URL(originalUrl);
      
      // Create CDN URL
      const cdnUrl = `https://${this.cdnDomain}${url.pathname}`;
      
      // Add image transformations if specified
      if (options.width || options.height || options.format || options.quality) {
        return this.addImageTransformations(cdnUrl, options);
      }
      
      return cdnUrl;
    } catch (error) {
      console.warn(`Failed to transform URL ${originalUrl}:`, error.message);
      return originalUrl;
    }
  }

  /**
   * Add Cloudflare image transformations to URL
   * Uses Cloudflare's Image Resizing feature (available on Pro plan and above)
   */
  addImageTransformations(cdnUrl, options = {}) {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());
    
    const transformParams = params.toString();
    if (transformParams) {
      // For Cloudflare Image Resizing: /cdn-cgi/image/width=300,height=200/original-url
      const baseUrl = cdnUrl.replace(`https://${this.cdnDomain}`, '');
      return `https://${this.cdnDomain}/cdn-cgi/image/${transformParams.replace(/&/g, ',')}${baseUrl}`;
    }
    
    return cdnUrl;
  }

  /**
   * Generate image variants with different sizes
   */
  generateImageVariants(originalUrl, metadata = {}) {
    const variants = {
      original: this.transformImageUrl(originalUrl)
    };
    
    // Generate different sizes
    Object.entries(this.imageSizes).forEach(([sizeName, sizeConfig]) => {
      variants[sizeName] = this.transformImageUrl(originalUrl, {
        ...sizeConfig,
        format: 'auto', // Cloudflare will serve best format
        quality: 85
      });
    });
    
    return variants;
  }

  /**
   * Process images for CDN delivery
   */
  async processImages(imageUrls, metadata = {}) {
    if (!this.enabled) {
      // Return original URLs if CDN is disabled
      return imageUrls.map(url => ({
        original_url: url,
        primary_url: url,
        variants: {
          original: url,
          thumbnail: url,
          small: url,
          medium: url, 
          large: url
        },
        cdn_enabled: false,
        processed_at: new Date().toISOString()
      }));
    }

    console.log(`🖼️ Processing ${imageUrls.length} images for CDN delivery`);
    
    const processedImages = imageUrls.map((url, index) => {
      try {
        const variants = this.generateImageVariants(url, metadata);
        
        return {
          original_url: url,
          primary_url: variants.original,
          variants: variants,
          cdn_enabled: true,
          cdn_domain: this.cdnDomain,
          metadata: {
            ...metadata,
            index: index,
            processed_at: new Date().toISOString()
          }
        };
      } catch (error) {
        console.warn(`Failed to process image ${url}:`, error.message);
        return {
          original_url: url,
          primary_url: url,
          variants: {
            original: url,
            thumbnail: url,
            small: url,
            medium: url,
            large: url
          },
          cdn_enabled: false,
          error: error.message,
          processed_at: new Date().toISOString()
        };
      }
    });

    console.log(`✅ Processed ${processedImages.length} images for CDN`);
    return processedImages;
  }

  /**
   * Test CDN connection and configuration
   */
  async testConnection() {
    const results = {
      cdn_enabled: this.enabled,
      cdn_domain: this.cdnDomain,
      zone_management: false,
      image_resizing: false,
      oauth_connected: false
    };

    if (!this.enabled) {
      results.status = 'disabled';
      return results;
    }

    // Test basic CDN domain accessibility
    try {
      const testResponse = await axios.head(`https://${this.cdnDomain}`, {
        timeout: 10000,
        validateStatus: () => true // Accept any status
      });
      
      results.domain_accessible = testResponse.status < 500;
      results.response_status = testResponse.status;
    } catch (error) {
      results.domain_accessible = false;
      results.domain_error = error.message;
    }

    // Test OAuth connection first (preferred method)
    if (this.storeId) {
      try {
        const credentials = await this.oauthService.getStoredCredentials(this.storeId);
        if (credentials) {
          results.oauth_connected = true;
          
          // Use OAuth for API calls
          const zoneData = await this.oauthService.makeAuthenticatedRequest(
            this.storeId,
            `/zones/${this.zoneId || 'first'}`
          );
          
          if (zoneData.success) {
            results.zone_management = true;
            results.zone_name = zoneData.result?.name || 'OAuth Connected';
            
            // If we don't have zoneId set, use the first zone
            if (!this.zoneId && zoneData.result?.id) {
              this.zoneId = zoneData.result.id;
            }
            
            // Check Image Resizing with OAuth
            const settingsData = await this.oauthService.makeAuthenticatedRequest(
              this.storeId,
              `/zones/${this.zoneId}/settings/image_resizing`
            );
            
            results.image_resizing = settingsData.result?.value === 'on';
          }
        }
      } catch (error) {
        results.oauth_error = error.message;
      }
    }

    // Fallback to API token if OAuth not available
    if (!results.oauth_connected && this.zoneId && this.apiToken) {
      try {
        const zoneResponse = await axios.get(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        results.zone_management = zoneResponse.data.success;
        results.zone_name = zoneResponse.data.result?.name;
        
        // Check if Image Resizing is available
        const settingsResponse = await axios.get(
          `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/settings/image_resizing`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        results.image_resizing = settingsResponse.data.result?.value === 'on';
      } catch (error) {
        results.api_error = error.message;
      }
    }

    results.status = results.domain_accessible ? 'connected' : 'error';
    results.auth_method = results.oauth_connected ? 'oauth' : 'api_token';
    return results;
  }

  /**
   * Enable Image Resizing for the zone (requires Pro plan or above)
   */
  async enableImageResizing() {
    if (!this.zoneId || !this.apiToken) {
      throw new Error('Zone ID and API token required for image resizing management');
    }

    try {
      const response = await axios.patch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/settings/image_resizing`,
        { value: 'on' },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Image Resizing enabled for zone');
        return { success: true, message: 'Image Resizing enabled' };
      } else {
        throw new Error(response.data.errors?.[0]?.message || 'Failed to enable Image Resizing');
      }
    } catch (error) {
      console.error('❌ Failed to enable Image Resizing:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Purge CDN cache for specific URLs
   */
  async purgeCache(urls = []) {
    if (!this.zoneId || !this.apiToken) {
      console.warn('Cannot purge cache: Zone ID and API token required');
      return { success: false, message: 'Zone credentials not configured' };
    }

    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
        { files: urls },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log(`✅ Purged cache for ${urls.length} URLs`);
        return { success: true, purged: urls.length };
      } else {
        throw new Error(response.data.errors?.[0]?.message || 'Cache purge failed');
      }
    } catch (error) {
      console.error('❌ Cache purge failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get CDN analytics (if available)
   */
  async getAnalytics(startDate, endDate) {
    if (!this.zoneId || !this.apiToken) {
      return { error: 'Zone credentials not configured' };
    }

    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/analytics/dashboard`,
        {
          params: {
            since: startDate,
            until: endDate
          },
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          analytics: response.data.result
        };
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate responsive image HTML with CDN URLs
   */
  generateResponsiveImageHtml(originalUrl, alt = '', className = '') {
    if (!this.enabled) {
      return `<img src="${originalUrl}" alt="${alt}" class="${className}" />`;
    }

    const variants = this.generateImageVariants(originalUrl);
    
    // Generate srcset for responsive images
    const srcset = [
      `${variants.small} 300w`,
      `${variants.medium} 500w`, 
      `${variants.large} 1200w`
    ].join(', ');

    return `<img 
      src="${variants.medium}" 
      srcset="${srcset}"
      sizes="(max-width: 300px) 300px, (max-width: 500px) 500px, 1200px"
      alt="${alt}" 
      class="${className}"
      loading="lazy"
    />`;
  }

  /**
   * Get service configuration and status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      cdn_domain: this.cdnDomain,
      zone_id_configured: !!this.zoneId,
      api_token_configured: !!this.apiToken,
      supported_formats: this.imageFormats,
      available_sizes: Object.keys(this.imageSizes)
    };
  }
}

module.exports = CloudflareCDNService;