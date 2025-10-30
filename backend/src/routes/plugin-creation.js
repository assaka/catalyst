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
const { authMiddleware } = require('../middleware/auth');
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
      templateId,
      adminNavigation: {
        enabled: false,
        label: name,
        icon: "Package",
        route: `/admin/plugins/${slug}`,
        order: 100,
        parentKey: null,
        category: category || "custom",
        description: description || `Manage ${name} settings`
      }
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
    console.log('🤖 Generating plugin with AI:', prompt);
    
    // Try to use OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a plugin code generator for an e-commerce platform. Generate a complete plugin based on the user's request.
              
              Return a JSON object with:
              - manifest: object with name, version, description, category, hooks array, and configSchema
              - code: string containing the JavaScript plugin class code
              - styles: optional CSS string
              
              Available hooks: homepage_header, homepage_content, product_detail_above, cart_summary, checkout_form, footer_content
              
              The code should be a class with methods that return HTML strings. Use template literals for HTML.
              Config values are passed as config parameter, store info as context parameter.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        });
        
        const response = JSON.parse(completion.choices[0].message.content);
        return {
          success: true,
          data: response,
          explanation: `Generated plugin using AI based on: "${prompt}"`
        };
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        // Fall back to enhanced mock generation
      }
    }
    
    // Enhanced mock generation with better pattern matching
    const promptLower = prompt.toLowerCase();
    
    // Analyze the prompt for intent
    const intents = {
      countdown: promptLower.includes('countdown') || promptLower.includes('timer'),
      popup: promptLower.includes('popup') || promptLower.includes('modal'),
      banner: promptLower.includes('banner') || promptLower.includes('announcement'),
      social: promptLower.includes('social') || promptLower.includes('facebook') || promptLower.includes('twitter'),
      gallery: promptLower.includes('gallery') || promptLower.includes('image') || promptLower.includes('carousel'),
      form: promptLower.includes('form') || promptLower.includes('contact') || promptLower.includes('subscribe'),
      welcome: promptLower.includes('welcome') || promptLower.includes('hello') || promptLower.includes('greeting')
    };
    
    let manifest, code, styles;
    
    if (intents.countdown) {
      // Generate countdown timer plugin
      manifest = {
        name: 'Sale Countdown Timer',
        version: '1.0.0',
        description: 'Display a countdown timer for sales and promotions',
        category: 'marketing',
        hooks: ['homepage_header', 'product_detail_above'],
        configSchema: {
          endDate: { type: 'string', default: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'Sale end date' },
          title: { type: 'string', default: 'Sale Ends In:', description: 'Timer title' },
          backgroundColor: { type: 'string', default: '#ff4444', description: 'Background color' },
          textColor: { type: 'string', default: '#ffffff', description: 'Text color' }
        }
      };
      
      code = `class SaleCountdownTimer {
  constructor() {
    this.name = 'Sale Countdown Timer';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    const endDate = new Date(config.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
    const timerId = 'countdown-' + Math.random().toString(36).substr(2, 9);
    
    return \`
      <div style="
        background: \${config.backgroundColor || '#ff4444'};
        color: \${config.textColor || '#ffffff'};
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin: 10px 0;
      ">
        <h3 style="margin: 0 0 10px 0;">\${config.title || 'Sale Ends In:'}</h3>
        <div id="\${timerId}" style="
          font-size: 24px;
          font-weight: bold;
          display: flex;
          justify-content: center;
          gap: 20px;
        ">
          <div><span id="\${timerId}-days">0</span> Days</div>
          <div><span id="\${timerId}-hours">0</span> Hours</div>
          <div><span id="\${timerId}-minutes">0</span> Minutes</div>
          <div><span id="\${timerId}-seconds">0</span> Seconds</div>
        </div>
      </div>
      <script>
        (function() {
          const endDate = new Date('\${endDate.toISOString()}');
          const timer = setInterval(function() {
            const now = new Date();
            const diff = endDate - now;
            
            if (diff <= 0) {
              clearInterval(timer);
              document.getElementById('\${timerId}').innerHTML = 'Sale has ended!';
              return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            document.getElementById('\${timerId}-days').textContent = days;
            document.getElementById('\${timerId}-hours').textContent = hours;
            document.getElementById('\${timerId}-minutes').textContent = minutes;
            document.getElementById('\${timerId}-seconds').textContent = seconds;
          }, 1000);
        })();
      </script>
    \`;
  }
  
  renderProductDetailAbove(config, context) {
    return this.renderHomepageHeader(config, context);
  }
}

module.exports = SaleCountdownTimer;`;
      
    } else if (intents.popup) {
      // Generate popup plugin
      manifest = {
        name: 'Promotional Popup',
        version: '1.0.0',
        description: 'Show timed promotional popups',
        category: 'marketing',
        hooks: ['homepage_header'],
        configSchema: {
          title: { type: 'string', default: 'Special Offer!', description: 'Popup title' },
          message: { type: 'string', default: 'Get 20% off your first order!', description: 'Popup message' },
          delay: { type: 'number', default: 5000, description: 'Delay before showing (ms)' },
          buttonText: { type: 'string', default: 'Shop Now', description: 'Button text' },
          buttonUrl: { type: 'string', default: '/products', description: 'Button URL' }
        }
      };
      
      code = `class PromotionalPopup {
  constructor() {
    this.name = 'Promotional Popup';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    const popupId = 'popup-' + Math.random().toString(36).substr(2, 9);
    
    return \`
      <div id="\${popupId}-container"></div>
      <script>
        setTimeout(function() {
          const popup = document.createElement('div');
          popup.id = '\${popupId}';
          popup.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            animation: fadeIn 0.3s ease;
          \`;
          
          popup.innerHTML = \`
            <button onclick="document.getElementById('\${popupId}').remove()" style="
              position: absolute;
              top: 10px;
              right: 10px;
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #999;
            ">&times;</button>
            <h2 style="margin: 0 0 15px 0; color: #333;">\${config.title}</h2>
            <p style="margin: 0 0 20px 0; color: #666;">\${config.message}</p>
            <a href="\${config.buttonUrl}" style="
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">\${config.buttonText}</a>
          \`;
          
          document.getElementById('\${popupId}-container').appendChild(popup);
          
          // Auto-close after 30 seconds
          setTimeout(function() {
            const p = document.getElementById('\${popupId}');
            if (p) p.remove();
          }, 30000);
        }, \${config.delay});
      </script>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      </style>
    \`;
  }
}

module.exports = PromotionalPopup;`;
      
    } else if (intents.social) {
      // Generate social media plugin
      manifest = {
        name: 'Social Media Links',
        version: '1.0.0',
        description: 'Display social media links with icons',
        category: 'marketing',
        hooks: ['footer_content'],
        configSchema: {
          facebook: { type: 'string', default: '', description: 'Facebook URL' },
          twitter: { type: 'string', default: '', description: 'Twitter/X URL' },
          instagram: { type: 'string', default: '', description: 'Instagram URL' },
          linkedin: { type: 'string', default: '', description: 'LinkedIn URL' },
          youtube: { type: 'string', default: '', description: 'YouTube URL' }
        }
      };
      
      code = `class SocialMediaLinks {
  constructor() {
    this.name = 'Social Media Links';
    this.version = '1.0.0';
  }
  
  renderFooterContent(config, context) {
    const links = [];
    
    if (config.facebook) {
      links.push({ name: 'Facebook', url: config.facebook, icon: '📘', color: '#1877f2' });
    }
    if (config.twitter) {
      links.push({ name: 'Twitter', url: config.twitter, icon: '🐦', color: '#1da1f2' });
    }
    if (config.instagram) {
      links.push({ name: 'Instagram', url: config.instagram, icon: '📷', color: '#e4405f' });
    }
    if (config.linkedin) {
      links.push({ name: 'LinkedIn', url: config.linkedin, icon: '💼', color: '#0077b5' });
    }
    if (config.youtube) {
      links.push({ name: 'YouTube', url: config.youtube, icon: '📺', color: '#ff0000' });
    }
    
    if (links.length === 0) return '';
    
    return \`
      <div style="
        background: #f8f9fa;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #dee2e6;
      ">
        <h4 style="margin: 0 0 20px 0; color: #495057;">Follow Us</h4>
        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
          \${links.map(link => \`
            <a href="\${link.url}" target="_blank" rel="noopener" style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 45px;
              height: 45px;
              background: \${link.color};
              color: white;
              border-radius: 50%;
              text-decoration: none;
              font-size: 20px;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
               title="\${link.name}">
              \${link.icon}
            </a>
          \`).join('')}
        </div>
      </div>
    \`;
  }
}

module.exports = SocialMediaLinks;`;
      
    } else if (intents.form) {
      // Generate subscription form plugin
      manifest = {
        name: 'Newsletter Subscription',
        version: '1.0.0',
        description: 'Newsletter subscription form',
        category: 'marketing',
        hooks: ['homepage_content', 'footer_content'],
        configSchema: {
          title: { type: 'string', default: 'Subscribe to Our Newsletter', description: 'Form title' },
          description: { type: 'string', default: 'Get the latest updates and exclusive offers', description: 'Form description' },
          buttonText: { type: 'string', default: 'Subscribe', description: 'Button text' },
          successMessage: { type: 'string', default: 'Thank you for subscribing!', description: 'Success message' }
        }
      };
      
      code = `class NewsletterSubscription {
  constructor() {
    this.name = 'Newsletter Subscription';
    this.version = '1.0.0';
  }
  
  renderHomepageContent(config, context) {
    const formId = 'newsletter-' + Math.random().toString(36).substr(2, 9);
    
    return \`
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        text-align: center;
        border-radius: 12px;
        margin: 20px 0;
      ">
        <h3 style="color: white; margin: 0 0 10px 0;">\${config.title}</h3>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0;">\${config.description}</p>
        <form id="\${formId}" style="max-width: 400px; margin: 0 auto;">
          <div style="display: flex; gap: 10px;">
            <input type="email" placeholder="Enter your email" required style="
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 6px;
              font-size: 16px;
            ">
            <button type="submit" style="
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: bold;
              cursor: pointer;
            ">\${config.buttonText}</button>
          </div>
        </form>
        <div id="\${formId}-message" style="color: white; margin-top: 15px; display: none;"></div>
      </div>
      <script>
        document.getElementById('\${formId}').addEventListener('submit', function(e) {
          e.preventDefault();
          const messageDiv = document.getElementById('\${formId}-message');
          messageDiv.textContent = '\${config.successMessage}';
          messageDiv.style.display = 'block';
          this.reset();
          setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
        });
      </script>
    \`;
  }
  
  renderFooterContent(config, context) {
    return this.renderHomepageContent(config, context);
  }
}

module.exports = NewsletterSubscription;`;
      
    } else {
      // Default/welcome plugin
      manifest = {
        name: prompt.slice(0, 30) || 'Custom Plugin',
        version: '1.0.0',
        description: prompt || 'AI-generated custom plugin',
        category: 'custom',
        hooks: ['homepage_header'],
        configSchema: {
          message: { type: 'string', default: 'Welcome!', description: 'Display message' },
          backgroundColor: { type: 'string', default: '#3b82f6', description: 'Background color' },
          textColor: { type: 'string', default: '#ffffff', description: 'Text color' }
        }
      };
      
      code = `class CustomPlugin {
  constructor() {
    this.name = '${manifest.name}';
    this.version = '1.0.0';
  }
  
  renderHomepageHeader(config, context) {
    return \`
      <div style="
        background: \${config.backgroundColor || '#3b82f6'};
        color: \${config.textColor || '#ffffff'};
        padding: 25px;
        text-align: center;
        border-radius: 10px;
        margin: 15px 0;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">\${config.message}</h2>
        <p style="margin: 0; opacity: 0.95; font-size: 16px;">
          Welcome to \${context.store.name}
        </p>
      </div>
    \`;
  }
}

module.exports = CustomPlugin;`;
    }
    
    return {
      success: true,
      data: { 
        manifest, 
        code, 
        styles: null 
      },
      explanation: `I've generated a ${manifest.name} plugin based on your request: "${prompt}"`
    };
    
  } catch (error) {
    console.error('AI generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate plugin'
    };
  }
}

module.exports = router;