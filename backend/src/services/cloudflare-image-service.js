const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class CloudflareImageService {
  constructor(config = {}) {
    this.accountId = config.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN;
    this.imagesApiKey = config.imagesApiKey || process.env.CLOUDFLARE_IMAGES_API_KEY;
    this.r2BucketName = config.r2BucketName || process.env.CLOUDFLARE_R2_BUCKET_NAME;
    this.r2AccessKeyId = config.r2AccessKeyId || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    this.r2SecretAccessKey = config.r2SecretAccessKey || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.r2Endpoint = config.r2Endpoint || process.env.CLOUDFLARE_R2_ENDPOINT;
    
    // Service configuration
    this.useCloudflareImages = config.useCloudflareImages !== false; // Default true
    this.useR2Storage = config.useR2Storage !== false; // Default true
    this.imageDomain = config.imageDomain || process.env.CLOUDFLARE_IMAGES_DOMAIN;
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.allowedMimeTypes = config.allowedMimeTypes || [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
    ];
    
    console.log('🔧 CloudflareImageService initialized with:');
    console.log('  Account ID present:', !!this.accountId);
    console.log('  API Token present:', !!this.apiToken);
    console.log('  Images API Key present:', !!this.imagesApiKey);
    console.log('  R2 Bucket:', this.r2BucketName);
    console.log('  Use Cloudflare Images:', this.useCloudflareImages);
    console.log('  Use R2 Storage:', this.useR2Storage);
    console.log('  Image Domain:', this.imageDomain);
  }

  /**
   * Validate service configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.accountId) errors.push('CLOUDFLARE_ACCOUNT_ID is required');
    if (!this.apiToken) errors.push('CLOUDFLARE_API_TOKEN is required');
    
    if (this.useCloudflareImages && !this.imagesApiKey) {
      errors.push('CLOUDFLARE_IMAGES_API_KEY is required when using Cloudflare Images');
    }
    
    if (this.useR2Storage) {
      if (!this.r2BucketName) errors.push('CLOUDFLARE_R2_BUCKET_NAME is required when using R2');
      if (!this.r2AccessKeyId) errors.push('CLOUDFLARE_R2_ACCESS_KEY_ID is required when using R2');
      if (!this.r2SecretAccessKey) errors.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY is required when using R2');
      if (!this.r2Endpoint) errors.push('CLOUDFLARE_R2_ENDPOINT is required when using R2');
    }
    
    return errors;
  }

  /**
   * Download image from Akeneo URL
   */
  async downloadImage(imageUrl, metadata = {}) {
    try {
      console.log(`📥 Downloading image: ${imageUrl}`);
      
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream',
        timeout: 30000,
        maxContentLength: this.maxFileSize,
        headers: {
          'User-Agent': 'DainoStore-Akeneo-Integration/1.0'
        }
      });

      // Validate content type
      const contentType = response.headers['content-type'];
      if (!this.allowedMimeTypes.includes(contentType)) {
        throw new Error(`Unsupported image type: ${contentType}`);
      }

      // Generate unique filename
      const extension = this.getExtensionFromMimeType(contentType);
      const filename = `${metadata.sku || 'image'}_${uuidv4()}${extension}`;
      
      // Create temporary file
      const tempDir = process.env.TEMP_DIR || '/tmp';
      const tempPath = path.join(tempDir, filename);
      
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          resolve({
            tempPath,
            filename,
            contentType,
            size: fs.statSync(tempPath).size,
            originalUrl: imageUrl
          });
        });
        
        writer.on('error', reject);
      });
      
    } catch (error) {
      console.error(`❌ Failed to download image ${imageUrl}:`, error.message);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }

  /**
   * Upload image to Cloudflare Images
   */
  async uploadToCloudflareImages(imageData, metadata = {}) {
    if (!this.useCloudflareImages) {
      throw new Error('Cloudflare Images is not enabled');
    }

    try {
      console.log(`📤 Uploading to Cloudflare Images: ${imageData.filename}`);
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imageData.tempPath));
      formData.append('id', imageData.filename.split('.')[0]); // Use filename without extension as ID
      
      if (metadata.alt) {
        formData.append('metadata', JSON.stringify({ alt: metadata.alt }));
      }

      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.imagesApiKey}`,
            ...formData.getHeaders()
          },
          timeout: 60000
        }
      );

      if (!response.data.success) {
        throw new Error(`Cloudflare Images API error: ${JSON.stringify(response.data.errors)}`);
      }

      const result = response.data.result;
      console.log(`✅ Uploaded to Cloudflare Images: ${result.id}`);
      
      return {
        id: result.id,
        url: result.variants[0], // Default variant URL
        variants: result.variants,
        uploaded_at: result.uploaded,
        service: 'cloudflare_images'
      };
      
    } catch (error) {
      console.error(`❌ Failed to upload to Cloudflare Images:`, error.message);
      throw new Error(`Cloudflare Images upload failed: ${error.message}`);
    }
  }

  /**
   * Upload image to Cloudflare R2
   */
  async uploadToR2(imageData, metadata = {}) {
    if (!this.useR2Storage) {
      throw new Error('Cloudflare R2 is not enabled');
    }

    try {
      console.log(`📤 Uploading to Cloudflare R2: ${imageData.filename}`);
      
      const AWS = require('aws-sdk');
      
      // Configure AWS SDK for Cloudflare R2
      const s3 = new AWS.S3({
        endpoint: this.r2Endpoint,
        accessKeyId: this.r2AccessKeyId,
        secretAccessKey: this.r2SecretAccessKey,
        region: 'auto',
        signatureVersion: 'v4'
      });

      // Generate storage path
      const storePath = this.generateStoragePath(imageData, metadata);
      
      const uploadParams = {
        Bucket: this.r2BucketName,
        Key: storePath,
        Body: fs.createReadStream(imageData.tempPath),
        ContentType: imageData.contentType,
        ContentLength: imageData.size,
        Metadata: {
          'original-url': imageData.originalUrl,
          'sku': metadata.sku || '',
          'alt': metadata.alt || '',
          'uploaded-at': new Date().toISOString()
        }
      };

      const result = await s3.upload(uploadParams).promise();
      console.log(`✅ Uploaded to Cloudflare R2: ${result.Key}`);
      
      return {
        key: result.Key,
        url: result.Location,
        etag: result.ETag,
        bucket: this.r2BucketName,
        service: 'cloudflare_r2'
      };
      
    } catch (error) {
      console.error(`❌ Failed to upload to Cloudflare R2:`, error.message);
      throw new Error(`Cloudflare R2 upload failed: ${error.message}`);
    }
  }

  /**
   * Process single image: download and upload to configured services
   */
  async processImage(imageUrl, metadata = {}) {
    let tempPath = null;
    
    try {
      // Download image
      const imageData = await this.downloadImage(imageUrl, metadata);
      tempPath = imageData.tempPath;
      
      const results = {
        original_url: imageUrl,
        processed_at: new Date().toISOString(),
        services: {}
      };

      // Upload to Cloudflare Images (if enabled)
      if (this.useCloudflareImages) {
        try {
          const imagesResult = await this.uploadToCloudflareImages(imageData, metadata);
          results.services.cloudflare_images = imagesResult;
          results.primary_url = imagesResult.url;
        } catch (error) {
          console.warn(`⚠️ Cloudflare Images upload failed: ${error.message}`);
          results.services.cloudflare_images = { error: error.message };
        }
      }

      // Upload to R2 (if enabled)
      if (this.useR2Storage) {
        try {
          const r2Result = await this.uploadToR2(imageData, metadata);
          results.services.cloudflare_r2 = r2Result;
          
          // Use R2 as primary if Images failed
          if (!results.primary_url) {
            results.primary_url = r2Result.url;
          }
        } catch (error) {
          console.warn(`⚠️ Cloudflare R2 upload failed: ${error.message}`);
          results.services.cloudflare_r2 = { error: error.message };
        }
      }

      // Fallback to original URL if all uploads failed
      if (!results.primary_url) {
        results.primary_url = imageUrl;
        results.fallback = true;
        console.warn(`⚠️ All uploads failed, using original URL: ${imageUrl}`);
      }

      return results;
      
    } catch (error) {
      console.error(`❌ Failed to process image ${imageUrl}:`, error.message);
      return {
        original_url: imageUrl,
        processed_at: new Date().toISOString(),
        error: error.message,
        primary_url: imageUrl, // Fallback to original
        fallback: true
      };
    } finally {
      // Cleanup temporary file
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup temp file: ${tempPath}`);
        }
      }
    }
  }

  /**
   * Process multiple images in parallel with concurrency control
   */
  async processImages(imageUrls, metadata = {}, concurrency = 3) {
    console.log(`🔄 Processing ${imageUrls.length} images with concurrency ${concurrency}`);
    
    const results = [];
    
    // Process images in batches to control concurrency
    for (let i = 0; i < imageUrls.length; i += concurrency) {
      const batch = imageUrls.slice(i, i + concurrency);
      const batchPromises = batch.map((url, index) => 
        this.processImage(url, { ...metadata, index: i + index })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Batch processing failed for image ${i + index}:`, result.reason);
          results.push({
            original_url: batch[index],
            processed_at: new Date().toISOString(),
            error: result.reason?.message || 'Unknown error',
            primary_url: batch[index],
            fallback: true
          });
        }
      });
      
      // Small delay between batches
      if (i + concurrency < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ Processed ${results.length} images`);
    return results;
  }

  /**
   * Generate storage path for R2
   */
  generateStoragePath(imageData, metadata = {}) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    let basePath = `products/${year}/${month}`;
    
    if (metadata.sku) {
      basePath = `products/${metadata.sku}`;
    }
    
    return `${basePath}/${imageData.filename}`;
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg'
    };
    
    return mimeToExt[mimeType] || '.jpg';
  }

  /**
   * Generate optimized image URLs for different use cases
   */
  generateImageVariants(processedImage) {
    const variants = {
      original: processedImage.primary_url,
      thumbnail: processedImage.primary_url,
      medium: processedImage.primary_url,
      large: processedImage.primary_url
    };

    // If using Cloudflare Images, generate variant URLs
    if (processedImage.services?.cloudflare_images?.variants) {
      const baseUrl = processedImage.services.cloudflare_images.url;
      const imageId = processedImage.services.cloudflare_images.id;
      
      variants.thumbnail = `${baseUrl.replace('/public', '/public/w=150,h=150,fit=crop')}`; 
      variants.medium = `${baseUrl.replace('/public', '/public/w=500,h=500,fit=scale-down')}`;
      variants.large = `${baseUrl.replace('/public', '/public/w=1200,h=1200,fit=scale-down')}`;
    }

    return variants;
  }

  /**
   * Test connection to Cloudflare services
   */
  async testConnection() {
    const results = {
      cloudflare_images: { enabled: this.useCloudflareImages },
      cloudflare_r2: { enabled: this.useR2Storage }
    };

    // Test Cloudflare Images API
    if (this.useCloudflareImages) {
      try {
        const response = await axios.get(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/stats`,
          {
            headers: { 'Authorization': `Bearer ${this.imagesApiKey}` },
            timeout: 10000
          }
        );
        
        results.cloudflare_images.status = response.data.success ? 'connected' : 'error';
        results.cloudflare_images.data = response.data.result;
      } catch (error) {
        results.cloudflare_images.status = 'error';
        results.cloudflare_images.error = error.message;
      }
    }

    // Test Cloudflare R2
    if (this.useR2Storage) {
      try {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({
          endpoint: this.r2Endpoint,
          accessKeyId: this.r2AccessKeyId,
          secretAccessKey: this.r2SecretAccessKey,
          region: 'auto'
        });

        await s3.headBucket({ Bucket: this.r2BucketName }).promise();
        results.cloudflare_r2.status = 'connected';
      } catch (error) {
        results.cloudflare_r2.status = 'error';
        results.cloudflare_r2.error = error.message;
      }
    }

    return results;
  }
}

module.exports = CloudflareImageService;