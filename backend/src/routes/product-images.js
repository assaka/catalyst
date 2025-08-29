const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');

const { Product } = require('../models');
const storageManager = require('../services/storage-manager');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication and automatic store resolution
router.use(authMiddleware);
router.use(storeResolver);

/**
 * POST /api/products/:productId/images
 * Upload images for a specific product
 */
router.post('/:productId/images', upload.array('images', 10), async (req, res) => {
  try {
    const { storeId } = req;
    const { productId } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    // Verify product exists and belongs to store
    const product = await Product.findOne({
      where: { 
        id: productId, 
        store_id: storeId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    console.log(`📤 Uploading ${req.files.length} images for product ${productId} in store ${storeId}`);

    // Upload options with organized directory structure  
    const uploadPromises = req.files.map(file => {
      const options = {
        useOrganizedStructure: true,
        type: 'product',
        filename: file.originalname,
        public: true,
        metadata: {
          product_id: productId,
          store_id: storeId,
          uploaded_by: req.user.id,
          upload_type: 'product_image'
        }
      };
      
      return storageManager.uploadFile(storeId, file, options);
    });

    // Upload all images in parallel
    const uploadResults = await Promise.allSettled(uploadPromises);
    
    // Separate successful and failed uploads
    const uploaded = [];
    const failed = [];
    
    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        uploaded.push(result.value);
      } else {
        failed.push({
          file: req.files[index].originalname,
          error: result.reason?.message || 'Upload failed'
        });
      }
    });

    const uploadResult = {
      uploaded,
      failed,
      totalUploaded: uploaded.length,
      totalFailed: failed.length
    };

    // Update product images array
    const currentImages = product.images || [];
    const newImages = uploadResult.uploaded.map((upload, index) => ({
      id: `img_${Date.now()}_${index}`,
      url: upload.publicUrl || upload.url,
      alt: req.body.alt?.[index] || `${product.name} image`,
      sort_order: currentImages.length + index,
      variants: {
        thumbnail: upload.publicUrl || upload.url,
        medium: upload.publicUrl || upload.url,
        large: upload.publicUrl || upload.url
      },
      metadata: {
        filename: upload.filename,
        path: upload.path,
        bucket: upload.bucket,
        size: upload.size,
        provider: 'supabase',
        uploaded_at: new Date().toISOString(),
        original_name: req.files[index].originalname
      }
    }));

    // Merge with existing images
    const updatedImages = [...currentImages, ...newImages];

    // Update product in database
    await product.update({ images: updatedImages });

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadResult.totalUploaded} images`,
      data: {
        product_id: productId,
        uploaded: uploadResult.uploaded,
        failed: uploadResult.failed,
        total_uploaded: uploadResult.totalUploaded,
        total_failed: uploadResult.totalFailed,
        updated_product_images: updatedImages
      }
    });

  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/products/:productId/images/:imageId
 * Update specific product image (alt text, sort order, etc.)
 */
router.put('/:productId/images/:imageId', async (req, res) => {
  try {
    const { storeId } = req;
    const { productId, imageId } = req.params;
    const { alt, sort_order } = req.body;

    // Verify product exists and belongs to store
    const product = await Product.findOne({
      where: { 
        id: productId, 
        store_id: storeId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    const images = product.images || [];
    const imageIndex = images.findIndex(img => img.id === imageId);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    // Update image properties
    const updatedImages = [...images];
    if (alt !== undefined) updatedImages[imageIndex].alt = alt;
    if (sort_order !== undefined) updatedImages[imageIndex].sort_order = parseInt(sort_order);
    
    // Update metadata
    updatedImages[imageIndex].metadata = {
      ...updatedImages[imageIndex].metadata,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    // Sort images by sort_order if it was changed
    if (sort_order !== undefined) {
      updatedImages.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Update product in database
    await product.update({ images: updatedImages });

    res.json({
      success: true,
      message: 'Image updated successfully',
      data: {
        product_id: productId,
        image_id: imageId,
        updated_image: updatedImages[imageIndex]
      }
    });

  } catch (error) {
    console.error('Product image update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/products/:productId/images/:imageId
 * Delete specific product image
 */
router.delete('/:productId/images/:imageId', async (req, res) => {
  try {
    const { storeId } = req;
    const { productId, imageId } = req.params;

    // Verify product exists and belongs to store
    const product = await Product.findOne({
      where: { 
        id: productId, 
        store_id: storeId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    const images = product.images || [];
    const imageIndex = images.findIndex(img => img.id === imageId);

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    const imageToDelete = images[imageIndex];

    // Try to delete from Supabase storage
    try {
      let imagePath = null;
      
      // Extract path from Supabase URL or use metadata
      if (imageToDelete.metadata?.path) {
        imagePath = imageToDelete.metadata.path;
      } else if (imageToDelete.url && imageToDelete.url.includes('supabase')) {
        // Extract path from Supabase URL structure
        const url = new URL(imageToDelete.url);
        const pathParts = url.pathname.split('/');
        // Supabase URLs: /storage/v1/object/public/bucket/path
        if (pathParts.includes('public') && pathParts.length > pathParts.indexOf('public') + 2) {
          const bucketIndex = pathParts.indexOf('public') + 1;
          imagePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } else if (imageToDelete.metadata?.filename) {
        // Fallback: construct organized path for products
        const nameWithoutExt = imageToDelete.metadata.filename.substring(0, imageToDelete.metadata.filename.lastIndexOf('.')) || imageToDelete.metadata.filename;
        const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length >= 2) {
          imagePath = `products/${cleanName[0]}/${cleanName[1]}/${imageToDelete.metadata.filename}`;
        } else {
          imagePath = `products/misc/${imageToDelete.metadata.filename}`;
        }
      }

      if (imagePath) {
        await storageManager.deleteFile(storeId, imagePath, imageToDelete.metadata?.bucket);
        console.log(`✅ Deleted image from storage: ${imagePath}`);
      }
    } catch (deleteError) {
      console.warn('Could not delete image from Supabase storage:', deleteError.message);
      // Continue with database deletion even if storage deletion fails
    }

    // Remove image from product images array
    const updatedImages = images.filter(img => img.id !== imageId);

    // Reorder remaining images
    updatedImages.forEach((img, index) => {
      img.sort_order = index;
    });

    // Update product in database
    await product.update({ images: updatedImages });

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        product_id: productId,
        deleted_image_id: imageId,
        remaining_images: updatedImages.length
      }
    });

  } catch (error) {
    console.error('Product image delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/products/:productId/images
 * Get all images for a product
 */
router.get('/:productId/images', async (req, res) => {
  try {
    const { storeId } = req;
    const { productId } = req.params;

    // Verify product exists and belongs to store
    const product = await Product.findOne({
      where: { 
        id: productId, 
        store_id: storeId 
      },
      attributes: ['id', 'name', 'images']
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    const images = product.images || [];
    
    // Sort by sort_order
    images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    res.json({
      success: true,
      data: {
        product_id: productId,
        product_name: product.name,
        images: images,
        total_images: images.length
      }
    });

  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/products/:productId/images/reorder
 * Reorder product images
 */
router.post('/:productId/images/reorder', async (req, res) => {
  try {
    const { storeId } = req;
    const { productId } = req.params;
    const { imageOrder } = req.body; // Array of image IDs in desired order

    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({
        success: false,
        error: 'imageOrder must be an array of image IDs'
      });
    }

    // Verify product exists and belongs to store
    const product = await Product.findOne({
      where: { 
        id: productId, 
        store_id: storeId 
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied'
      });
    }

    const images = product.images || [];

    // Create new ordered array
    const reorderedImages = [];
    
    // Add images in the specified order
    imageOrder.forEach((imageId, index) => {
      const image = images.find(img => img.id === imageId);
      if (image) {
        reorderedImages.push({
          ...image,
          sort_order: index,
          metadata: {
            ...image.metadata,
            updated_at: new Date().toISOString(),
            updated_by: req.user.id
          }
        });
      }
    });

    // Add any remaining images not in the order (shouldn't happen normally)
    images.forEach(image => {
      if (!reorderedImages.find(img => img.id === image.id)) {
        reorderedImages.push({
          ...image,
          sort_order: reorderedImages.length
        });
      }
    });

    // Update product in database
    await product.update({ images: reorderedImages });

    res.json({
      success: true,
      message: 'Images reordered successfully',
      data: {
        product_id: productId,
        reordered_images: reorderedImages
      }
    });

  } catch (error) {
    console.error('Product image reorder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;