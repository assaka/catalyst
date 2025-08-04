const express = require('express');
const router = express.Router();
const AkeneoSyncService = require('../services/akeneo-sync-service');
const CloudflareImageService = require('../services/cloudflare-image-service');
const authMiddleware = require('../middleware/auth');

/**
 * Test image processing configuration
 */
router.post('/test-config', authMiddleware, async (req, res) => {
  try {
    const { store_id, test_url } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const syncService = new AkeneoSyncService();
    await syncService.initialize(store_id);
    
    const result = await syncService.testImageProcessing(test_url);
    
    res.json(result);
  } catch (error) {
    console.error('Image config test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test image configuration',
      error: error.message
    });
  }
});

/**
 * Process images for existing products
 */
router.post('/process-products', authMiddleware, async (req, res) => {
  try {
    const { 
      store_id, 
      limit = 50, 
      offset = 0, 
      force_reprocess = false,
      concurrency = 2 
    } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const syncService = new AkeneoSyncService();
    await syncService.initialize(store_id);
    
    const result = await syncService.processProductImages({
      limit: parseInt(limit),
      offset: parseInt(offset),
      forceReprocess: force_reprocess,
      concurrency: parseInt(concurrency)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Product image processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process product images',
      error: error.message
    });
  }
});

/**
 * Get image processing statistics
 */
router.get('/stats/:store_id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.params;
    
    const syncService = new AkeneoSyncService();
    await syncService.initialize(store_id);
    
    const stats = await syncService.getImageStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Failed to get image stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image statistics',
      error: error.message
    });
  }
});

/**
 * Test direct Cloudflare connection
 */
router.post('/test-cloudflare', authMiddleware, async (req, res) => {
  try {
    const config = req.body;
    
    const imageService = new CloudflareImageService(config);
    const errors = imageService.validateConfig();
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Configuration validation failed',
        errors
      });
    }
    
    const result = await imageService.testConnection();
    
    res.json({
      success: true,
      connection_test: result
    });
  } catch (error) {
    console.error('Cloudflare connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Cloudflare connection',
      error: error.message
    });
  }
});

/**
 * Process a single image URL
 */
router.post('/process-url', authMiddleware, async (req, res) => {
  try {
    const { image_url, metadata = {}, config = {} } = req.body;
    
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const imageService = new CloudflareImageService(config);
    const result = await imageService.processImage(image_url, metadata);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Image URL processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process image URL',
      error: error.message
    });
  }
});

/**
 * Get image processing status for products
 */
router.get('/product-status/:store_id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const { Product } = require('../models');
    
    const products = await Product.findAll({
      where: { store_id },
      attributes: ['id', 'sku', 'name', 'images'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updated_at', 'DESC']]
    });
    
    const productStatus = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      has_images: product.images && product.images.length > 0,
      image_count: product.images ? product.images.length : 0,
      processed_images: product.images ? 
        product.images.filter(img => img.metadata && img.metadata.processed_at).length : 0,
      cloudflare_images: product.images ?
        product.images.filter(img => img.metadata && img.metadata.cloudflare_id).length : 0,
      fallback_images: product.images ?
        product.images.filter(img => img.metadata && img.metadata.fallback).length : 0
    }));
    
    res.json({
      success: true,
      products: productStatus,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: await Product.count({ where: { store_id } })
      }
    });
  } catch (error) {
    console.error('Failed to get product image status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product image status',
      error: error.message
    });
  }
});

/**
 * Bulk process images for multiple products
 */
router.post('/bulk-process', authMiddleware, async (req, res) => {
  try {
    const { 
      store_id, 
      product_ids = [], 
      force_reprocess = false,
      concurrency = 2 
    } = req.body;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    if (product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product ID is required'
      });
    }

    const { Product } = require('../models');
    const syncService = new AkeneoSyncService();
    await syncService.initialize(store_id);
    
    // Get selected products
    const products = await Product.findAll({
      where: { 
        store_id,
        id: product_ids
      }
    });
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found with the provided IDs'
      });
    }

    let processedCount = 0;
    const errors = [];
    
    // Process in batches
    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (product) => {
        try {
          // Get fresh product data from Akeneo
          const akeneoProduct = await syncService.integration.client.getProduct(
            product.akeneo_uuid || product.sku
          );
          
          // Process images
          const processedImages = await syncService.imageProcessor.processProductImages(
            akeneoProduct, 
            syncService.config.baseUrl
          );

          if (processedImages.length > 0) {
            // Convert to Catalyst format
            const catalystImages = syncService.imageProcessor.convertToCatalystFormat(processedImages);
            
            // Update product
            await product.update({ images: catalystImages });
            return true;
          }
          
          return false;
        } catch (error) {
          errors.push({
            product_id: product.id,
            product_sku: product.sku,
            error: error.message
          });
          return false;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      processedCount += batchResults.filter(r => r.status === 'fulfilled' && r.value).length;

      // Small delay between batches
      if (i + concurrency < products.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    res.json({
      success: true,
      processed: processedCount,
      total: products.length,
      errors,
      message: `Processed images for ${processedCount} out of ${products.length} products`
    });
  } catch (error) {
    console.error('Bulk image processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process images in bulk',
      error: error.message
    });
  }
});

module.exports = router;