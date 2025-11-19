const supabaseStorage = require('./supabase-storage');
const ConnectionManager = require('./database/ConnectionManager');

class SupabaseProductImageService {
  constructor() {
    this.defaultFolder = 'products';
    this.thumbnailFolder = 'products/thumbnails';
  }

  /**
   * Upload product images to Supabase Storage
   */
  async uploadProductImages(storeId, productId, files, options = {}) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Check if Supabase is connected
      const { data: tokens, error: tokenError } = await tenantDb
        .from('supabase_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .limit(1);

      if (tokenError || !tokens || tokens.length === 0) {
        throw new Error('Supabase not connected for this store');
      }

      const folder = options.folder || `${this.defaultFolder}/${productId}`;
      
      // Upload all images
      const uploadResults = await supabaseStorage.uploadMultipleImages(storeId, files, {
        folder,
        public: true
      });

      // Update product with image URLs
      if (uploadResults.successful && uploadResults.successful.length > 0) {
        await this.updateProductImages(storeId, productId, uploadResults.successful);
      }

      return {
        success: true,
        uploaded: uploadResults.uploaded,
        failed: uploadResults.failed,
        totalUploaded: uploadResults.totalUploaded,
        totalFailed: uploadResults.totalFailed
      };
    } catch (error) {
      console.error('Error uploading product images to Supabase:', error);
      throw new Error('Failed to upload product images: ' + error.message);
    }
  }

  /**
   * Upload single product image
   */
  async uploadProductImage(storeId, productId, file, options = {}) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokens, error: tokenError } = await tenantDb
        .from('supabase_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .limit(1);

      if (tokenError || !tokens || tokens.length === 0) {
        throw new Error('Supabase not connected for this store');
      }

      const folder = options.folder || `${this.defaultFolder}/${productId}`;
      const imageType = options.type || 'gallery'; // 'base', 'thumbnail', 'gallery'
      
      const uploadResult = await supabaseStorage.uploadImage(storeId, file, {
        folder,
        public: true
      });

      if (uploadResult.success) {
        await this.updateProductImage(storeId, productId, uploadResult, imageType);
      }

      return uploadResult;
    } catch (error) {
      console.error('Error uploading product image to Supabase:', error);
      throw new Error('Failed to upload product image: ' + error.message);
    }
  }

  /**
   * Update product with uploaded image URLs
   */
  async updateProductImages(storeId, productId, uploadedImages) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Get product
      const { data: products, error: fetchError } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (fetchError || !products || products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];

      // Get existing images
      const existingImages = product.images || [];

      // Add new images
      const newImages = uploadedImages.map(upload => ({
        url: upload.url,
        path: upload.path,
        bucket: upload.bucket,
        size: upload.size,
        mimetype: upload.mimetype,
        uploadedAt: new Date(),
        source: 'supabase'
      }));

      // Merge with existing images
      const allImages = [...existingImages, ...newImages];

      // Update product
      const { error: updateError } = await tenantDb
        .from('products')
        .update({ images: allImages })
        .eq('id', productId);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      return {
        success: true,
        totalImages: allImages.length,
        newImages: newImages.length
      };
    } catch (error) {
      console.error('Error updating product images:', error);
      throw error;
    }
  }

  /**
   * Update product with single uploaded image
   */
  async updateProductImage(storeId, productId, uploadResult, imageType = 'gallery') {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Get product
      const { data: products, error: fetchError } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (fetchError || !products || products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];

      const imageData = {
        url: uploadResult.url,
        path: uploadResult.path,
        bucket: uploadResult.bucket,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype,
        uploadedAt: new Date(),
        source: 'supabase',
        type: imageType
      };

      let updateData = {};

      switch (imageType) {
        case 'base':
          updateData.base_image = uploadResult.url;
          updateData.base_image_data = imageData;
          break;
        case 'thumbnail':
          updateData.thumbnail_image = uploadResult.url;
          updateData.thumbnail_image_data = imageData;
          break;
        default:
          // Add to gallery images
          const existingImages = product.images || [];
          updateData.images = [...existingImages, imageData];
          break;
      }

      const { error: updateError } = await tenantDb
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      return { success: true, imageType, imageData };
    } catch (error) {
      console.error('Error updating product image:', error);
      throw error;
    }
  }

  /**
   * Delete product image from Supabase Storage
   */
  async deleteProductImage(storeId, productId, imagePath) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Delete from Supabase
      await supabaseStorage.deleteImage(storeId, imagePath);

      // Get product
      const { data: products, error: fetchError } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (!fetchError && products && products.length > 0) {
        const product = products[0];
        let updateData = {};

        // Check if it's a base or thumbnail image
        if (product.base_image_data?.path === imagePath) {
          updateData.base_image = null;
          updateData.base_image_data = null;
        } else if (product.thumbnail_image_data?.path === imagePath) {
          updateData.thumbnail_image = null;
          updateData.thumbnail_image_data = null;
        } else {
          // Remove from gallery images
          const images = product.images || [];
          updateData.images = images.filter(img => img.path !== imagePath);
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await tenantDb
            .from('products')
            .update(updateData)
            .eq('id', productId);

          if (updateError) {
            throw new Error(`Failed to update product: ${updateError.message}`);
          }
        }
      }

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw new Error('Failed to delete product image: ' + error.message);
    }
  }

  /**
   * Migrate existing product images to Supabase
   */
  async migrateProductImagesToSupabase(storeId, productId) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: tokens, error: tokenError } = await tenantDb
        .from('supabase_oauth_tokens')
        .select('*')
        .eq('store_id', storeId)
        .limit(1);

      if (tokenError || !tokens || tokens.length === 0) {
        throw new Error('Supabase not connected for this store');
      }

      const { data: products, error: fetchError } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (fetchError || !products || products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];

      const migrationResults = {
        migrated: [],
        failed: [],
        skipped: []
      };

      // Migrate base image
      if (product.base_image && !product.base_image.includes('supabase')) {
        try {
          const migratedBase = await this.migrateImageUrl(storeId, product.base_image, `${this.defaultFolder}/${productId}/base`);
          if (migratedBase.success) {
            const { error: updateError } = await tenantDb
              .from('products')
              .update({
                base_image: migratedBase.url,
                base_image_data: {
                  url: migratedBase.url,
                  path: migratedBase.path,
                  source: 'supabase',
                  migratedAt: new Date()
                }
              })
              .eq('id', productId);

            if (updateError) {
              throw new Error(`Failed to update base image: ${updateError.message}`);
            }
            migrationResults.migrated.push({ type: 'base', url: migratedBase.url });
          }
        } catch (error) {
          migrationResults.failed.push({ type: 'base', error: error.message });
        }
      } else {
        migrationResults.skipped.push({ type: 'base', reason: 'Already on Supabase or no image' });
      }

      // Migrate thumbnail image
      if (product.thumbnail_image && !product.thumbnail_image.includes('supabase')) {
        try {
          const migratedThumb = await this.migrateImageUrl(storeId, product.thumbnail_image, `${this.thumbnailFolder}/${productId}`);
          if (migratedThumb.success) {
            const { error: updateError } = await tenantDb
              .from('products')
              .update({
                thumbnail_image: migratedThumb.url,
                thumbnail_image_data: {
                  url: migratedThumb.url,
                  path: migratedThumb.path,
                  source: 'supabase',
                  migratedAt: new Date()
                }
              })
              .eq('id', productId);

            if (updateError) {
              throw new Error(`Failed to update thumbnail image: ${updateError.message}`);
            }
            migrationResults.migrated.push({ type: 'thumbnail', url: migratedThumb.url });
          }
        } catch (error) {
          migrationResults.failed.push({ type: 'thumbnail', error: error.message });
        }
      } else {
        migrationResults.skipped.push({ type: 'thumbnail', reason: 'Already on Supabase or no image' });
      }

      // Migrate gallery images
      const images = product.images || [];
      const migratedImages = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.url && !image.url.includes('supabase')) {
          try {
            const migratedImage = await this.migrateImageUrl(storeId, image.url, `${this.defaultFolder}/${productId}/gallery-${i}`);
            if (migratedImage.success) {
              migratedImages.push({
                ...image,
                url: migratedImage.url,
                path: migratedImage.path,
                source: 'supabase',
                migratedAt: new Date()
              });
              migrationResults.migrated.push({ type: 'gallery', url: migratedImage.url });
            }
          } catch (error) {
            migrationResults.failed.push({ type: 'gallery', error: error.message });
            migratedImages.push(image); // Keep original
          }
        } else {
          migratedImages.push(image); // Keep as-is
          migrationResults.skipped.push({ type: 'gallery', reason: 'Already on Supabase' });
        }
      }

      // Update product with migrated images
      if (migratedImages.length > 0) {
        const { error: updateError } = await tenantDb
          .from('products')
          .update({ images: migratedImages })
          .eq('id', productId);

        if (updateError) {
          throw new Error(`Failed to update gallery images: ${updateError.message}`);
        }
      }

      return {
        success: true,
        results: migrationResults,
        summary: {
          total: migrationResults.migrated.length + migrationResults.failed.length + migrationResults.skipped.length,
          migrated: migrationResults.migrated.length,
          failed: migrationResults.failed.length,
          skipped: migrationResults.skipped.length
        }
      };
    } catch (error) {
      console.error('Error migrating product images:', error);
      throw new Error('Failed to migrate product images: ' + error.message);
    }
  }

  /**
   * Migrate a single image URL to Supabase
   */
  async migrateImageUrl(storeId, imageUrl, targetPath) {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Create file object
      const file = {
        buffer,
        mimetype: contentType,
        size: buffer.length,
        originalname: targetPath.split('/').pop(),
        name: targetPath.split('/').pop()
      };

      // Upload to Supabase
      return await supabaseStorage.uploadImage(storeId, file, {
        folder: targetPath.split('/').slice(0, -1).join('/'),
        public: true
      });
    } catch (error) {
      console.error('Error migrating image URL:', error);
      throw error;
    }
  }

  /**
   * Get product images with CDN URLs
   */
  async getProductImages(storeId, productId) {
    try {
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { data: products, error: fetchError } = await tenantDb
        .from('products')
        .select('*')
        .eq('id', productId)
        .limit(1);

      if (fetchError || !products || products.length === 0) {
        throw new Error('Product not found');
      }

      const product = products[0];

      return {
        success: true,
        baseImage: product.base_image,
        thumbnailImage: product.thumbnail_image,
        galleryImages: product.images || [],
        totalImages: (product.images || []).length + (product.base_image ? 1 : 0) + (product.thumbnail_image ? 1 : 0)
      };
    } catch (error) {
      console.error('Error getting product images:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseProductImageService();