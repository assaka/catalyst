const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const StoreTemplate = require('../models/StoreTemplate');
const TemplateAsset = require('../models/TemplateAsset');
const StoreSupabaseConnection = require('../models/StoreSupabaseConnection');
const StoreDataMigration = require('../models/StoreDataMigration');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../../uploads/templates');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.js', '.css', '.html', '.json', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JS, CSS, HTML, JSON, images and fonts are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/stores/:store_id/template-customization/assets
 * Get all template assets for a store
 */
router.get('/assets', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { template_id, asset_type } = req.query;
    
    let assets;
    if (template_id) {
      assets = await TemplateAsset.findByTemplate(template_id, asset_type);
    } else {
      assets = await TemplateAsset.findByStore(storeId, asset_type);
    }

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    console.error('Get template assets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/template-customization/assets/upload
 * Upload template assets (JS, CSS, images, etc.)
 */
router.post('/assets/upload', upload.array('assets', 10), async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { template_id, asset_type } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Get store's Supabase connection
    const supabaseConnection = await StoreSupabaseConnection.findActiveByStore(storeId);
    
    const uploadedAssets = [];
    
    for (const file of req.files) {
      let finalAssetUrl = `/uploads/templates/${file.filename}`;
      let finalAssetPath = file.path;
      
      // If store has Supabase connection, upload there
      if (supabaseConnection) {
        try {
          const { createClient } = require('@supabase/supabase-js');
          const supabase = createClient(
            supabaseConnection.project_url,
            supabaseConnection.getDecryptedServiceKey()
          );
          
          const fileBuffer = await fs.readFile(file.path);
          const supabasePath = `templates/${template_id || 'global'}/${file.filename}`;
          
          const { data, error } = await supabase.storage
            .from('assets')
            .upload(supabasePath, fileBuffer, {
              contentType: file.mimetype,
              upsert: true
            });
          
          if (!error) {
            const { data: urlData } = supabase.storage
              .from('assets')
              .getPublicUrl(supabasePath);
            
            finalAssetUrl = urlData.publicUrl;
            finalAssetPath = supabasePath;
          }
        } catch (supabaseError) {
          console.error('Supabase upload error:', supabaseError);
          // Fall back to local storage
        }
      }
      
      // Create asset record
      const asset = await TemplateAsset.createOrUpdate(storeId, template_id, {
        asset_name: file.originalname,
        asset_type: asset_type || getAssetTypeFromExtension(file.originalname),
        asset_path: finalAssetPath,
        asset_url: finalAssetUrl,
        file_size: file.size,
        mime_type: file.mimetype
      });
      
      uploadedAssets.push(asset);
    }

    res.json({
      success: true,
      message: `Uploaded ${uploadedAssets.length} asset(s)`,
      data: uploadedAssets
    });
  } catch (error) {
    console.error('Upload assets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/stores/:store_id/template-customization/assets/:asset_id
 * Update template asset
 */
router.put('/assets/:asset_id', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { asset_id } = req.params;
    const updateData = req.body;
    
    const asset = await TemplateAsset.findOne({
      where: {
        id: asset_id,
        store_id: storeId
      }
    });
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    await asset.update(updateData);
    
    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/stores/:store_id/template-customization/assets/:asset_id
 * Delete template asset
 */
router.delete('/assets/:asset_id', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { asset_id } = req.params;
    
    const asset = await TemplateAsset.findOne({
      where: {
        id: asset_id,
        store_id: storeId
      }
    });
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    // Delete from Supabase if applicable
    const supabaseConnection = await StoreSupabaseConnection.findActiveByStore(storeId);
    if (supabaseConnection && asset.asset_path.startsWith('templates/')) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          supabaseConnection.project_url,
          supabaseConnection.getDecryptedServiceKey()
        );
        
        await supabase.storage
          .from('assets')
          .remove([asset.asset_path]);
      } catch (supabaseError) {
        console.error('Supabase delete error:', supabaseError);
      }
    }
    
    // Delete local file if exists
    try {
      if (asset.asset_path.startsWith('/uploads/')) {
        await fs.unlink(path.join(__dirname, '../../..', asset.asset_path));
      }
    } catch (fileError) {
      console.error('Local file delete error:', fileError);
    }
    
    await asset.destroy();
    
    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/template-customization/assets/stats
 * Get asset statistics for a store
 */
router.get('/assets/stats', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    const stats = await TemplateAsset.getAssetStats(storeId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get asset stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/template-customization/separate-js
 * Separate JavaScript from HTML templates
 */
router.post('/separate-js', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { template_id } = req.body;
    
    let templates;
    if (template_id) {
      const template = await StoreTemplate.findOne({
        where: { id: template_id, store_id: storeId }
      });
      templates = template ? [template] : [];
    } else {
      templates = await StoreTemplate.findByStore(storeId);
    }
    
    const results = [];
    
    for (const template of templates) {
      const separationResult = await separateJavaScriptFromTemplate(template, storeId);
      results.push(separationResult);
    }
    
    res.json({
      success: true,
      message: `Processed ${results.length} template(s)`,
      data: results
    });
  } catch (error) {
    console.error('Separate JS error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/template-customization/supabase-connection
 * Create or update Supabase connection
 */
router.post('/supabase-connection', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { project_url, anon_key, service_key, jwt_secret, database_url, connection_name } = req.body;
    
    if (!project_url || !anon_key || !service_key) {
      return res.status(400).json({
        success: false,
        error: 'Project URL, anon key, and service key are required'
      });
    }
    
    const connection = await StoreSupabaseConnection.createOrUpdate(storeId, {
      connection_name: connection_name || 'primary',
      project_url,
      anon_key,
      service_key,
      jwt_secret,
      database_url
    });
    
    // Test the connection
    const testResult = await connection.testConnection();
    
    res.json({
      success: true,
      message: 'Supabase connection configured successfully',
      data: {
        connection: {
          id: connection.id,
          connection_name: connection.connection_name,
          project_url: connection.project_url,
          connection_status: connection.connection_status,
          created_at: connection.created_at
        },
        test_result: testResult
      }
    });
  } catch (error) {
    console.error('Supabase connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stores/:store_id/template-customization/supabase-connections
 * Get Supabase connections for a store
 */
router.get('/supabase-connections', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    
    const stats = await StoreSupabaseConnection.getConnectionStats(storeId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get Supabase connections error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getAssetTypeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const typeMap = {
    '.js': 'javascript',
    '.css': 'css',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.gif': 'image',
    '.svg': 'image',
    '.webp': 'image',
    '.woff': 'font',
    '.woff2': 'font',
    '.ttf': 'font',
    '.eot': 'font'
  };
  
  return typeMap[ext] || 'other';
}

async function separateJavaScriptFromTemplate(template, storeId) {
  try {
    const extractedJs = [];
    const cleanedElements = [];
    
    // Process each template element
    for (const element of template.elements) {
      const { cleanContent, jsCode } = extractJavaScriptFromHTML(element.content);
      
      if (jsCode) {
        // Create JavaScript asset
        const jsAsset = await TemplateAsset.createOrUpdate(storeId, template.id, {
          asset_name: `${element.id || 'element'}-${Date.now()}.js`,
          asset_type: 'javascript',
          asset_path: `/assets/js/${template.type}/${element.id || 'element'}-${Date.now()}.js`,
          asset_url: `/assets/js/${template.type}/${element.id || 'element'}-${Date.now()}.js`,
          file_size: jsCode.length,
          mime_type: 'application/javascript'
        });
        
        extractedJs.push(jsAsset);
        
        // Update element content to reference external JS
        element.content = cleanContent;
        element.javascript_references = element.javascript_references || [];
        element.javascript_references.push(jsAsset.id);
      }
      
      cleanedElements.push(element);
    }
    
    // Update template with cleaned elements
    await template.update({ 
      elements: cleanedElements,
      updated_at: new Date()
    });
    
    return {
      template_id: template.id,
      extracted_js_count: extractedJs.length,
      extracted_assets: extractedJs
    };
  } catch (error) {
    console.error('Separate JS from template error:', error);
    throw error;
  }
}

function extractJavaScriptFromHTML(htmlContent) {
  // Simple regex to find <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [];
  let match;
  
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    matches.push(match[1].trim());
  }
  
  // Remove script tags from HTML
  const cleanContent = htmlContent.replace(scriptRegex, '');
  
  // Combine all JavaScript code
  const jsCode = matches.length > 0 ? matches.join('\n\n') : null;
  
  return {
    cleanContent: cleanContent.trim(),
    jsCode
  };
}

module.exports = router;