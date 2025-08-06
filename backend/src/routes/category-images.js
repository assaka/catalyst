const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const { extractStoreId, checkStoreOwnership } = require('../middleware/storeAuth');
const { Category } = require('../models');
const storageManager = require('../services/storage-manager');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once for categories
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

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(extractStoreId);
router.use(checkStoreOwnership);

/**
 * POST /api/categories/:categoryId/image
 * Upload main image for a category
 */
router.post('/:categoryId/image', upload.single('image'), async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    console.log(`📤 Uploading main image for category ${categoryId} in store ${storeId}`);

    // Upload options - organize by category
    const options = {
      folder: `categories/${categoryId}`,
      public: true,
      metadata: {
        category_id: categoryId,
        store_id: storeId,
        uploaded_by: req.user.id,
        upload_type: 'category_image',
        image_type: 'main'
      }
    };

    const uploadResult = await storageManager.uploadImage(storeId, req.file, options);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }

    // Update category image_url
    await category.update({ 
      image_url: uploadResult.url,
      // Store additional metadata in a separate field if needed
      image_metadata: {
        filename: uploadResult.filename,
        size: uploadResult.size,
        provider: uploadResult.provider,
        uploaded_at: new Date().toISOString(),
        original_name: req.file.originalname,
        fallback_used: uploadResult.fallbackUsed || false
      }
    });

    res.json({
      success: true,
      message: 'Category image uploaded successfully',
      data: {
        category_id: categoryId,
        category_name: category.name,
        image_url: uploadResult.url,
        provider: uploadResult.provider,
        fallback_used: uploadResult.fallbackUsed || false,
        upload_details: uploadResult
      }
    });

  } catch (error) {
    console.error('Category image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/categories/:categoryId/banner
 * Upload banner image for a category
 */
router.post('/:categoryId/banner', upload.single('banner'), async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No banner file provided'
      });
    }

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    console.log(`📤 Uploading banner image for category ${categoryId} in store ${storeId}`);

    // Upload options - organize by category
    const options = {
      folder: `categories/${categoryId}/banners`,
      public: true,
      metadata: {
        category_id: categoryId,
        store_id: storeId,
        uploaded_by: req.user.id,
        upload_type: 'category_banner',
        image_type: 'banner'
      }
    };

    const uploadResult = await storageManager.uploadImage(storeId, req.file, options);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload banner'
      });
    }

    // Get current banner images or initialize empty array
    const bannerImages = category.banner_images || [];
    
    // Add new banner image
    const newBanner = {
      id: `banner_${Date.now()}`,
      url: uploadResult.url,
      alt: req.body.alt || `${category.name} banner`,
      sort_order: bannerImages.length,
      metadata: {
        filename: uploadResult.filename,
        size: uploadResult.size,
        provider: uploadResult.provider,
        uploaded_at: new Date().toISOString(),
        original_name: req.file.originalname
      }
    };

    const updatedBanners = [...bannerImages, newBanner];

    // Update category with new banner
    await category.update({ banner_images: updatedBanners });

    res.json({
      success: true,
      message: 'Category banner uploaded successfully',
      data: {
        category_id: categoryId,
        category_name: category.name,
        banner: newBanner,
        total_banners: updatedBanners.length,
        provider: uploadResult.provider
      }
    });

  } catch (error) {
    console.error('Category banner upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories/:categoryId/images
 * Get all images for a category (main image + banners)
 */
router.get('/:categoryId/images', async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId } = req.params;

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      },
      attributes: ['id', 'name', 'image_url', 'image_metadata', 'banner_images']
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    const banners = category.banner_images || [];
    
    // Sort banners by sort_order
    banners.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    res.json({
      success: true,
      data: {
        category_id: categoryId,
        category_name: category.name,
        main_image: {
          url: category.image_url,
          metadata: category.image_metadata
        },
        banner_images: banners,
        total_banners: banners.length
      }
    });

  } catch (error) {
    console.error('Get category images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/categories/:categoryId/image
 * Delete main category image
 */
router.delete('/:categoryId/image', async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId } = req.params;

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    if (!category.image_url) {
      return res.status(404).json({
        success: false,
        error: 'No main image to delete'
      });
    }

    // Try to delete from storage
    try {
      let imagePath = null;
      
      // Extract path based on provider
      if (category.image_metadata?.filename) {
        imagePath = `categories/${categoryId}/${category.image_metadata.filename}`;
      } else {
        // Try to extract from URL
        const url = new URL(category.image_url);
        imagePath = url.pathname.substring(1); // Remove leading slash
      }

      if (imagePath) {
        await storageManager.deleteImage(storeId, imagePath, category.image_metadata?.provider);
        console.log(`✅ Deleted main image from storage: ${imagePath}`);
      }
    } catch (deleteError) {
      console.warn('Could not delete main image from storage:', deleteError.message);
      // Continue with database deletion even if storage deletion fails
    }

    // Remove image from category
    await category.update({ 
      image_url: null,
      image_metadata: null
    });

    res.json({
      success: true,
      message: 'Category main image deleted successfully',
      data: {
        category_id: categoryId
      }
    });

  } catch (error) {
    console.error('Category image delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/categories/:categoryId/banners/:bannerId
 * Delete specific banner image
 */
router.delete('/:categoryId/banners/:bannerId', async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId, bannerId } = req.params;

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    const banners = category.banner_images || [];
    const bannerIndex = banners.findIndex(banner => banner.id === bannerId);

    if (bannerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    const bannerToDelete = banners[bannerIndex];

    // Try to delete from storage
    try {
      let imagePath = null;
      
      // Extract path based on provider
      if (bannerToDelete.metadata?.filename) {
        imagePath = `categories/${categoryId}/banners/${bannerToDelete.metadata.filename}`;
      } else {
        // Try to extract from URL
        const url = new URL(bannerToDelete.url);
        imagePath = url.pathname.substring(1); // Remove leading slash
      }

      if (imagePath) {
        await storageManager.deleteImage(storeId, imagePath, bannerToDelete.metadata?.provider);
        console.log(`✅ Deleted banner from storage: ${imagePath}`);
      }
    } catch (deleteError) {
      console.warn('Could not delete banner from storage:', deleteError.message);
      // Continue with database deletion even if storage deletion fails
    }

    // Remove banner from array
    const updatedBanners = banners.filter(banner => banner.id !== bannerId);

    // Reorder remaining banners
    updatedBanners.forEach((banner, index) => {
      banner.sort_order = index;
    });

    // Update category in database
    await category.update({ banner_images: updatedBanners });

    res.json({
      success: true,
      message: 'Category banner deleted successfully',
      data: {
        category_id: categoryId,
        deleted_banner_id: bannerId,
        remaining_banners: updatedBanners.length
      }
    });

  } catch (error) {
    console.error('Category banner delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/categories/:categoryId/banners/reorder
 * Reorder category banner images
 */
router.post('/:categoryId/banners/reorder', async (req, res) => {
  try {
    const { storeId } = req;
    const { categoryId } = req.params;
    const { bannerOrder } = req.body; // Array of banner IDs in desired order

    if (!Array.isArray(bannerOrder)) {
      return res.status(400).json({
        success: false,
        error: 'bannerOrder must be an array of banner IDs'
      });
    }

    // Verify category exists and belongs to store
    const category = await Category.findOne({
      where: { 
        id: categoryId, 
        store_id: storeId 
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found or access denied'
      });
    }

    const banners = category.banner_images || [];

    // Create new ordered array
    const reorderedBanners = [];
    
    // Add banners in the specified order
    bannerOrder.forEach((bannerId, index) => {
      const banner = banners.find(b => b.id === bannerId);
      if (banner) {
        reorderedBanners.push({
          ...banner,
          sort_order: index,
          metadata: {
            ...banner.metadata,
            updated_at: new Date().toISOString(),
            updated_by: req.user.id
          }
        });
      }
    });

    // Add any remaining banners not in the order (shouldn't happen normally)
    banners.forEach(banner => {
      if (!reorderedBanners.find(b => b.id === banner.id)) {
        reorderedBanners.push({
          ...banner,
          sort_order: reorderedBanners.length
        });
      }
    });

    // Update category in database
    await category.update({ banner_images: reorderedBanners });

    res.json({
      success: true,
      message: 'Category banners reordered successfully',
      data: {
        category_id: categoryId,
        reordered_banners: reorderedBanners
      }
    });

  } catch (error) {
    console.error('Category banner reorder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;