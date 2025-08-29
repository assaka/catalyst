const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageManager = require('../services/storage-manager');
const { Category } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for category images
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// All routes require authentication and automatic store resolution
router.use(authMiddleware);
router.use(storeResolver);

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

    // Upload options with organized directory structure
    const options = {
      useOrganizedStructure: true,
      type: 'category',
      filename: req.file.originalname,
      public: true,
      metadata: {
        category_id: categoryId,
        store_id: storeId,
        uploaded_by: req.user.id,
        upload_type: 'category_image',
        image_type: 'main'
      }
    };

    // Use flexible storage manager - easily switch between different providers!
    const uploadResult = await storageManager.uploadFile(storeId, req.file, options);

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload image'
      });
    }

    // Update category image_url
    await category.update({ 
      image_url: uploadResult.publicUrl || uploadResult.url,
      // Store additional metadata in a separate field if needed
      image_metadata: {
        filename: uploadResult.filename,
        path: uploadResult.path,
        bucket: uploadResult.bucket,
        size: uploadResult.size,
        provider: 'supabase',
        uploaded_at: new Date().toISOString(),
        original_name: req.file.originalname
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

    // Upload options - use custom folder for banners (not organized structure)
    const options = {
      useOrganizedStructure: false,
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

    const uploadResult = await storageManager.uploadFile(storeId, req.file, options);

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
      url: uploadResult.publicUrl || uploadResult.url,
      alt: req.body.alt || `${category.name} banner`,
      sort_order: bannerImages.length,
      metadata: {
        filename: uploadResult.filename,
        path: uploadResult.path,
        bucket: uploadResult.bucket,
        size: uploadResult.size,
        provider: 'supabase',
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

    // Try to delete from Supabase storage
    try {
      let imagePath = null;
      
      // Extract path from Supabase URL or use metadata
      if (category.image_metadata?.path) {
        imagePath = category.image_metadata.path;
      } else if (category.image_url && category.image_url.includes('supabase')) {
        // Extract path from Supabase URL structure
        const url = new URL(category.image_url);
        const pathParts = url.pathname.split('/');
        // Supabase URLs: /storage/v1/object/public/bucket/path
        if (pathParts.includes('public') && pathParts.length > pathParts.indexOf('public') + 2) {
          const bucketIndex = pathParts.indexOf('public') + 1;
          imagePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } else if (category.image_metadata?.filename) {
        // Fallback: construct organized path
        const nameWithoutExt = category.image_metadata.filename.substring(0, category.image_metadata.filename.lastIndexOf('.')) || category.image_metadata.filename;
        const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanName.length >= 2) {
          imagePath = `categories/${cleanName[0]}/${cleanName[1]}/${category.image_metadata.filename}`;
        } else {
          imagePath = `categories/misc/${category.image_metadata.filename}`;
        }
      }

      if (imagePath) {
        await storageManager.deleteFile(storeId, imagePath, category.image_metadata?.bucket);
        console.log(`✅ Deleted main image from storage: ${imagePath}`);
      }
    } catch (deleteError) {
      console.warn('Could not delete main image from Supabase storage:', deleteError.message);
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

    // Try to delete from Supabase storage
    try {
      let imagePath = null;
      
      // Extract path from Supabase URL or use metadata
      if (bannerToDelete.metadata?.path) {
        imagePath = bannerToDelete.metadata.path;
      } else if (bannerToDelete.url && bannerToDelete.url.includes('supabase')) {
        // Extract path from Supabase URL structure
        const url = new URL(bannerToDelete.url);
        const pathParts = url.pathname.split('/');
        // Supabase URLs: /storage/v1/object/public/bucket/path
        if (pathParts.includes('public') && pathParts.length > pathParts.indexOf('public') + 2) {
          const bucketIndex = pathParts.indexOf('public') + 1;
          imagePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } else if (bannerToDelete.metadata?.filename) {
        // For banners uploaded to custom folder
        imagePath = `categories/${categoryId}/banners/${bannerToDelete.metadata.filename}`;
      }

      if (imagePath) {
        await storageManager.deleteFile(storeId, imagePath, bannerToDelete.metadata?.bucket);
        console.log(`✅ Deleted banner from storage: ${imagePath}`);
      }
    } catch (deleteError) {
      console.warn('Could not delete banner from Supabase storage:', deleteError.message);
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