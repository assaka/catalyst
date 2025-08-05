const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const pluginManager = require('../core/PluginManager');
const Plugin = require('../models/Plugin');
const PluginConfiguration = require('../models/PluginConfiguration');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

// Configure multer for ZIP file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || 
        file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  }
});

// All routes require authentication and store ownership
router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/stores/:store_id/plugins/create/templates
 * Get plugin templates for the builder
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'hello-world',
        name: 'Hello World Message',
        description: 'Simple message display on homepage',
        category: 'display',
        hooks: ['homepage_header'],
        configSchema: {
          message: { type: 'string', default: 'Hello World!' },
          backgroundColor: { type: 'string', default: '#f0f0f0' },
          textColor: { type: 'string', default: '#333333' }
        },
        code: `function renderHelloWorld(config, context) {
  return \`
    <div style="
      background-color: \${config.backgroundColor};
      color: \${config.textColor};
      padding: 15px;
      text-align: center;
      border-radius: 8px;
      margin: 10px 0;
    ">
      <h3>\${config.message}</h3>
      <p>Welcome to \${context.store.name}!</p>
    </div>
  \`;
}`
      },
      {
        id: 'announcement-banner',
        name: 'Announcement Banner',
        description: 'Promotional banner with custom styling',
        category: 'marketing',
        hooks: ['homepage_header', 'product_page_header'],
        configSchema: {
          title: { type: 'string', default: 'Special Offer!' },
          message: { type: 'string', default: 'Get 20% off your first order' },
          buttonText: { type: 'string', default: 'Shop Now' },
          buttonUrl: { type: 'string', default: '/products' },
          bannerColor: { type: 'string', default: '#ff6b6b' }
        },
        code: `function renderAnnouncementBanner(config, context) {
  return \`
    <div style="
      background: linear-gradient(135deg, \${config.bannerColor}, \${config.bannerColor}dd);
      color: white;
      padding: 20px;
      text-align: center;
      margin: 10px 0;
    ">
      <h2 style="margin: 0 0 10px 0;">\${config.title}</h2>
      <p style="margin: 0 0 15px 0;">\${config.message}</p>
      <a href="\${config.buttonUrl}" style="
        background: white;
        color: \${config.bannerColor};
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      ">\${config.buttonText}</a>
    </div>
  \`;
}`
      },
      {
        id: 'social-media-links',
        name: 'Social Media Links',
        description: 'Display social media icons and links',
        category: 'social',
        hooks: ['homepage_footer', 'product_page_footer'],
        configSchema: {
          facebook: { type: 'string', default: '' },
          twitter: { type: 'string', default: '' },
          instagram: { type: 'string', default: '' },
          linkedin: { type: 'string', default: '' },
          iconSize: { type: 'number', default: 32 }
        },
        code: `function renderSocialMediaLinks(config, context) {
  const links = [];
  
  if (config.facebook) links.push(\`<a href="\${config.facebook}" target="_blank">📘 Facebook</a>\`);
  if (config.twitter) links.push(\`<a href="\${config.twitter}" target="_blank">🐦 Twitter</a>\`);
  if (config.instagram) links.push(\`<a href="\${config.instagram}" target="_blank">📸 Instagram</a>\`);
  if (config.linkedin) links.push(\`<a href="\${config.linkedin}" target="_blank">💼 LinkedIn</a>\`);
  
  if (links.length === 0) return '';
  
  return \`
    <div style="
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eee;
    ">
      <h4>Follow Us</h4>
      <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
        \${links.join('')}
      </div>
    </div>
  \`;
}`
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/create/web
 * Create plugin via web builder
 */
router.post('/web', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;
    const {
      name,
      description,
      category = 'custom',
      hooks = [],
      code,
      configSchema = {},
      templateId = null
    } = req.body;

    console.log(`🔧 Creating web plugin for store ${storeId}:`, name);

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: 'Plugin name and code are required'
      });
    }

    // Generate plugin slug
    let slug = name.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
    
    // Check for slug conflicts
    const existingPlugin = await Plugin.findBySlug(slug);
    if (existingPlugin) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create plugin manifest
    const manifest = {
      name,
      slug,
      version: '1.0.0',
      description,
      author: user.email || 'Store Owner',
      category,
      hooks: Array.isArray(hooks) ? hooks : [hooks],
      configSchema,
      createdBy: 'web-builder',
      templateId
    };

    // Create plugin files structure
    const pluginDir = path.join(__dirname, '../../plugins', slug);
    
    // Ensure plugins directory exists
    const pluginsDir = path.join(__dirname, '../../plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    // Create plugin directory
    fs.mkdirSync(pluginDir, { recursive: true });

    // Write manifest.json
    fs.writeFileSync(
      path.join(pluginDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Write plugin code
    const pluginCode = `/**
 * ${name}
 * Generated by Catalyst Plugin Builder
 * Author: ${manifest.author}
 */

class ${slug.replace(/-/g, '')}Plugin {
  ${code}
}

module.exports = ${slug.replace(/-/g, '')}Plugin;
`;
    
    fs.writeFileSync(path.join(pluginDir, 'index.js'), pluginCode);

    // Create basic CSS file
    const cssContent = `/* ${name} Styles */
.${slug}-container {
  /* Add your custom styles here */
}
`;
    fs.writeFileSync(path.join(pluginDir, 'styles.css'), cssContent);

    // Create plugin database record
    const plugin = await Plugin.create({
      name,
      slug,
      version: '1.0.0',
      description,
      author: manifest.author,
      sourceType: 'web-builder',
      sourceUrl: null,
      status: 'installed',
      category,
      configSchema,
      createdBy: user.id
    });

    console.log(`✅ Web plugin created: ${plugin.name} (${plugin.id})`);

    // Sync with plugin manager
    await pluginManager.initialize();

    res.json({
      success: true,
      message: 'Plugin created successfully via web builder',
      data: {
        plugin: {
          id: plugin.id,
          name: plugin.name,
          slug: plugin.slug,
          version: plugin.version,
          category: plugin.category,
          status: plugin.status
        },
        manifest
      }
    });

  } catch (error) {
    console.error('Web plugin creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/create/upload
 * Upload and install plugin ZIP file
 */
router.post('/upload', upload.single('pluginZip'), async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No ZIP file uploaded'
      });
    }

    console.log(`📁 Processing plugin ZIP upload for store ${storeId}`);

    // Extract ZIP file
    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();

    // Find and validate manifest.json
    const manifestEntry = zipEntries.find(entry => 
      entry.entryName.endsWith('manifest.json') && !entry.isDirectory
    );

    if (!manifestEntry) {
      return res.status(400).json({
        success: false,
        error: 'manifest.json not found in ZIP file'
      });
    }

    // Parse manifest
    let manifest;
    try {
      manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid manifest.json format'
      });
    }

    // Validate manifest
    const requiredFields = ['name', 'slug', 'version', 'description'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required manifest fields: ${missingFields.join(', ')}`
      });
    }

    // Check for slug conflicts
    const existingPlugin = await Plugin.findBySlug(manifest.slug);
    if (existingPlugin) {
      return res.status(400).json({
        success: false,
        error: `Plugin with slug '${manifest.slug}' already exists`
      });
    }

    // Create plugin directory
    const pluginDir = path.join(__dirname, '../../plugins', manifest.slug);
    
    // Ensure plugins directory exists
    const pluginsDir = path.join(__dirname, '../../plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    fs.mkdirSync(pluginDir, { recursive: true });

    // Extract all files to plugin directory
    zipEntries.forEach(entry => {
      if (!entry.isDirectory) {
        const fileName = path.basename(entry.entryName);
        const filePath = path.join(pluginDir, fileName);
        
        // Security: Only allow specific file types
        const allowedExtensions = ['.js', '.json', '.css', '.md', '.txt'];
        const fileExt = path.extname(fileName).toLowerCase();
        
        if (allowedExtensions.includes(fileExt)) {
          fs.writeFileSync(filePath, entry.getData());
        }
      }
    });

    // Create plugin database record
    const plugin = await Plugin.create({
      name: manifest.name,
      slug: manifest.slug,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author || user.email || 'Store Owner',
      sourceType: 'upload',
      sourceUrl: null,
      status: 'installed',
      category: manifest.category || 'custom',
      configSchema: manifest.configSchema || {},
      createdBy: user.id
    });

    console.log(`✅ ZIP plugin installed: ${plugin.name} (${plugin.id})`);

    // Sync with plugin manager
    await pluginManager.initialize();

    res.json({
      success: true,
      message: 'Plugin uploaded and installed successfully',
      data: {
        plugin: {
          id: plugin.id,
          name: plugin.name,
          slug: plugin.slug,
          version: plugin.version,
          category: plugin.category,
          status: plugin.status
        },
        filesExtracted: zipEntries.length
      }
    });

  } catch (error) {
    console.error('Plugin upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/stores/:store_id/plugins/create/ai
 * Create plugin using AI assistance
 */
router.post('/ai', async (req, res) => {
  try {
    const storeId = req.params.store_id;
    const { user } = req;
    const { prompt, context = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'AI prompt is required'
      });
    }

    console.log(`🤖 AI plugin generation for store ${storeId}:`, prompt);

    // AI Plugin Generation Logic
    // This would integrate with OpenAI or similar service
    const aiResponse = await generatePluginWithAI(prompt, context);

    if (!aiResponse.success) {
      return res.status(400).json({
        success: false,
        error: aiResponse.error
      });
    }

    const { manifest, code, styles } = aiResponse.data;

    // Generate unique slug
    let slug = manifest.name.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '-');
    const existingPlugin = await Plugin.findBySlug(slug);
    if (existingPlugin) {
      slug = `${slug}-ai-${Date.now()}`;
    }

    manifest.slug = slug;

    // Create plugin files
    const pluginDir = path.join(__dirname, '../../plugins', slug);
    const pluginsDir = path.join(__dirname, '../../plugins');
    
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }
    
    fs.mkdirSync(pluginDir, { recursive: true });

    // Write files
    fs.writeFileSync(
      path.join(pluginDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    fs.writeFileSync(path.join(pluginDir, 'index.js'), code);
    
    if (styles) {
      fs.writeFileSync(path.join(pluginDir, 'styles.css'), styles);
    }

    // Create database record
    const plugin = await Plugin.create({
      name: manifest.name,
      slug,
      version: manifest.version,
      description: manifest.description,
      author: user.email || 'Store Owner',
      sourceType: 'ai-generated',
      sourceUrl: null,
      status: 'installed',
      category: manifest.category || 'ai-generated',
      configSchema: manifest.configSchema || {},
      createdBy: user.id
    });

    console.log(`✅ AI plugin created: ${plugin.name} (${plugin.id})`);

    // Sync with plugin manager
    await pluginManager.initialize();

    res.json({
      success: true,
      message: 'Plugin generated successfully with AI',
      data: {
        plugin: {
          id: plugin.id,
          name: plugin.name,
          slug: plugin.slug,
          version: plugin.version,
          category: plugin.category,
          status: plugin.status
        },
        aiResponse: aiResponse.explanation
      }
    });

  } catch (error) {
    console.error('AI plugin creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Plugin Generation Function
 */
async function generatePluginWithAI(prompt, context) {
  try {
    // This is a mock implementation
    // In production, this would call OpenAI GPT-4 or similar
    console.log('🤖 Generating plugin with AI:', prompt);

    // Simple keyword-based generation for demo
    const isHelloWorld = prompt.toLowerCase().includes('hello') || 
                         prompt.toLowerCase().includes('welcome');
    
    const isBanner = prompt.toLowerCase().includes('banner') || 
                     prompt.toLowerCase().includes('announcement');

    let manifest, code, styles;

    if (isHelloWorld) {
      manifest = {
        name: 'AI Welcome Message',
        version: '1.0.0',
        description: 'AI-generated welcome message plugin',
        category: 'ai-generated',
        hooks: ['homepage_header'],
        configSchema: {
          message: { type: 'string', default: 'Welcome!' },
          style: { type: 'string', default: 'modern' }
        }
      };

      code = `/**
 * AI-Generated Welcome Message Plugin
 */
class AIWelcomeMessagePlugin {
  renderWelcomeMessage(config, context) {
    const styles = config.style === 'modern' ? 
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;' :
      'background: #f8f9fa; color: #333; border: 2px solid #dee2e6;';
    
    return \`
      <div style="\${styles} padding: 20px; text-align: center; margin: 15px 0;">
        <h2 style="margin: 0 0 10px 0;">\${config.message}</h2>
        <p style="margin: 0; opacity: 0.9;">
          Welcome to \${context.store.name}! We're glad you're here.
        </p>
      </div>
    \`;
  }
}

module.exports = AIWelcomeMessagePlugin;`;

    } else if (isBanner) {
      manifest = {
        name: 'AI Announcement Banner',
        version: '1.0.0',
        description: 'AI-generated announcement banner',
        category: 'marketing',
        hooks: ['homepage_header'],
        configSchema: {
          title: { type: 'string', default: 'Special Announcement' },
          message: { type: 'string', default: 'Check out our latest offers!' }
        }
      };

      code = `/**
 * AI-Generated Announcement Banner
 */
class AIAnnouncementBannerPlugin {
  renderAnnouncementBanner(config, context) {
    return \`
      <div style="
        background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
        color: white;
        padding: 15px;
        text-align: center;
        margin: 10px 0;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h3 style="margin: 0 0 8px 0;">\${config.title}</h3>
        <p style="margin: 0;">\${config.message}</p>
      </div>
    \`;
  }
}

module.exports = AIAnnouncementBannerPlugin;`;

    } else {
      // Generic plugin
      manifest = {
        name: 'AI Custom Plugin',
        version: '1.0.0',
        description: 'AI-generated custom plugin',
        category: 'custom',
        hooks: ['homepage_content'],
        configSchema: {
          content: { type: 'string', default: 'Custom content' }
        }
      };

      code = `/**
 * AI-Generated Custom Plugin
 */
class AICustomPlugin {
  renderCustomContent(config, context) {
    return \`
      <div style="
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin: 15px 0;
      ">
        <p>\${config.content}</p>
        <small>Generated by AI for \${context.store.name}</small>
      </div>
    \`;
  }
}

module.exports = AICustomPlugin;`;
    }

    return {
      success: true,
      data: { manifest, code, styles: null },
      explanation: `I've generated a ${manifest.name} based on your request: "${prompt}"`
    };

  } catch (error) {
    console.error('AI generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = router;