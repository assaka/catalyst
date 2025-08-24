const fs = require('fs').promises;
const path = require('path');

class CustomizationInjector {
  constructor() {
    this.customizations = new Map();
    this.injectionPoints = {
      'homepage-hero': {
        cssFile: 'src/styles/components/hero.css',
        jsFile: 'src/components/HeroSection.jsx',
        htmlInsertPoint: '<div id="hero-section"',
        cssInsertPoint: '/* Custom styles placeholder */',
        jsInsertPoint: '// Custom functionality placeholder',
      },
      'product-card': {
        cssFile: 'src/styles/components/product-card.css',
        jsFile: 'src/components/ProductCard.jsx',
        htmlInsertPoint: '<div class="product-card"',
        cssInsertPoint: '/* Product card custom styles */',
        jsInsertPoint: '// Product card custom functionality',
      },
      'navigation-menu': {
        cssFile: 'src/styles/components/navigation.css',
        jsFile: 'src/components/Navigation.jsx',
        htmlInsertPoint: '<nav class="main-navigation"',
        cssInsertPoint: '/* Navigation custom styles */',
        jsInsertPoint: '// Navigation custom functionality',
      },
      'footer': {
        cssFile: 'src/styles/components/footer.css',
        jsFile: 'src/components/Footer.jsx',
        htmlInsertPoint: '<footer class="site-footer"',
        cssInsertPoint: '/* Footer custom styles */',
        jsInsertPoint: '// Footer custom functionality',
      },
    };
  }

  // Load customizations from database
  async loadCustomizations(userId, storeId) {
    const { HybridCustomization } = require('../models');
    
    const customizations = await HybridCustomization.findAll({
      where: {
        store_id: storeId,  // Use store-scoped instead of user-scoped
        status: 'active'
      },
      order: [['created_at', 'DESC']]
    });

    this.customizations.clear();
    
    for (const customization of customizations) {
      this.customizations.set(customization.component_name, {
        id: customization.id,
        componentName: customization.component_name,
        code: customization.component_code,
        customizations: customization.customizations,
        version: customization.version,
      });
    }

    return this.customizations.size;
  }

  // Generate deployment package with injected customizations
  async generateDeploymentPackage(userId, storeId, outputDir) {
    try {
      console.log('🔄 Starting customization injection process...');
      
      // Load user customizations
      const customizationCount = await this.loadCustomizations(userId, storeId);
      console.log(`📦 Loaded ${customizationCount} customizations`);

      // Copy base source code to output directory
      await this.copyBaseSource(outputDir);

      // Inject customizations
      for (const [componentName, customization] of this.customizations) {
        await this.injectCustomization(outputDir, componentName, customization);
      }

      // Generate customization manifest
      await this.generateManifest(outputDir, userId, storeId);

      console.log('✅ Deployment package generated successfully');
      return {
        success: true,
        outputDir,
        customizationCount,
        manifest: path.join(outputDir, 'customization-manifest.json'),
      };
    } catch (error) {
      console.error('❌ Error generating deployment package:', error);
      throw error;
    }
  }

  // Copy base source code (excluding source files that shouldn't be in production)
  async copyBaseSource(outputDir) {
    const baseDir = process.cwd();
    const filesToCopy = [
      'package.json',
      'package-lock.json',
      'vite.config.js',
      'tailwind.config.js',
      'postcss.config.js',
      'index.html',
    ];

    const dirsToCreate = [
      'src/styles/components',
      'src/components',
      'src/services',
      'public',
    ];

    // Create directory structure
    for (const dir of dirsToCreate) {
      const dirPath = path.join(outputDir, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }

    // Copy essential files
    for (const file of filesToCopy) {
      const sourcePath = path.join(baseDir, file);
      const destPath = path.join(outputDir, file);
      
      try {
        await fs.copyFile(sourcePath, destPath);
        console.log(`📄 Copied ${file}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    // Copy public assets
    try {
      await this.copyDirectory(path.join(baseDir, 'public'), path.join(outputDir, 'public'));
    } catch (error) {
      console.warn('⚠️ Could not copy public directory:', error.message);
    }

    // Create base component templates
    await this.createBaseTemplates(outputDir);
  }

  // Create base component templates that will be customized
  async createBaseTemplates(outputDir) {
    const templates = {
      'src/components/HeroSection.jsx': `
import React from 'react';
import './HeroSection.css';

export default function HeroSection({ customizations = {} }) {
  const styles = {
    backgroundColor: customizations.backgroundColor || '#ffffff',
    color: customizations.textColor || '#000000',
    ...customizations.styles,
  };

  return (
    <div id="hero-section" className="hero-section" style={styles}>
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {customizations.content?.headline || 'Welcome to Our Store'}
          </h1>
          <p className="text-xl mb-8">
            {customizations.content?.subheadline || 'Discover amazing products at great prices'}
          </p>
          <a
            href={customizations.content?.buttonLink || '/products'}
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {customizations.content?.buttonText || 'Shop Now'}
          </a>
        </div>
      </div>
      {/* Custom functionality placeholder */}
    </div>
  );
}`,

      'src/components/ProductCard.jsx': `
import React from 'react';
import './ProductCard.css';

export default function ProductCard({ product, customizations = {} }) {
  const cardStyles = {
    backgroundColor: customizations.backgroundColor || '#ffffff',
    borderColor: customizations.borderColor || '#e5e7eb',
    ...customizations.styles,
  };

  return (
    <div className="product-card" style={cardStyles}>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-content">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">
          {customizations.priceFormat === 'decimal' 
            ? parseFloat(product.price).toFixed(2)
            : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)
          }
        </p>
        {customizations.showAddToCart && (
          <button className="add-to-cart-btn">Add to Cart</button>
        )}
      </div>
      {/* Product card custom functionality */}
    </div>
  );
}`,

      'src/styles/components/hero.css': `
.hero-section {
  /* Default hero styles */
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom styles placeholder */`,

      'src/styles/components/product-card.css': `
.product-card {
  /* Default product card styles */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s ease;
}

.product-card:hover {
  transform: translateY(-2px);
}

/* Product card custom styles */`,
    };

    for (const [filePath, content] of Object.entries(templates)) {
      const fullPath = path.join(outputDir, filePath);
      await fs.writeFile(fullPath, content.trim(), 'utf8');
      console.log(`📝 Created template: ${filePath}`);
    }
  }

  // Inject specific customization into the deployment package
  async injectCustomization(outputDir, componentName, customization) {
    const injectionPoint = this.injectionPoints[componentName];
    if (!injectionPoint) {
      console.warn(`⚠️ No injection point defined for ${componentName}`);
      return;
    }

    console.log(`🔧 Injecting customization for ${componentName}`);

    // Inject CSS customizations
    if (customization.customizations?.styles?.customCSS) {
      await this.injectCSS(
        outputDir, 
        injectionPoint.cssFile,
        customization.customizations.styles.customCSS,
        injectionPoint.cssInsertPoint
      );
    }

    // Inject JavaScript customizations
    if (customization.customizations?.customJS) {
      await this.injectJS(
        outputDir,
        injectionPoint.jsFile,
        customization.customizations.customJS,
        injectionPoint.jsInsertPoint
      );
    }

    // Create customization config file
    await this.createCustomizationConfig(outputDir, componentName, customization);
  }

  // Inject CSS customizations
  async injectCSS(outputDir, cssFile, customCSS, insertPoint) {
    const cssPath = path.join(outputDir, cssFile);
    
    try {
      let cssContent = await fs.readFile(cssPath, 'utf8');
      
      if (cssContent.includes(insertPoint)) {
        cssContent = cssContent.replace(insertPoint, `${insertPoint}\n${customCSS}`);
      } else {
        cssContent += `\n/* Injected Custom Styles */\n${customCSS}`;
      }
      
      await fs.writeFile(cssPath, cssContent, 'utf8');
      console.log(`📄 Injected CSS into ${cssFile}`);
    } catch (error) {
      console.error(`❌ Error injecting CSS into ${cssFile}:`, error.message);
    }
  }

  // Inject JavaScript customizations
  async injectJS(outputDir, jsFile, customJS, insertPoint) {
    const jsPath = path.join(outputDir, jsFile);
    
    try {
      let jsContent = await fs.readFile(jsPath, 'utf8');
      
      if (jsContent.includes(insertPoint)) {
        jsContent = jsContent.replace(insertPoint, `${insertPoint}\n${customJS}`);
      } else {
        // Add before the last closing brace
        const lastBraceIndex = jsContent.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          jsContent = jsContent.slice(0, lastBraceIndex) + 
                     `\n/* Injected Custom JavaScript */\n${customJS}\n` + 
                     jsContent.slice(lastBraceIndex);
        }
      }
      
      await fs.writeFile(jsPath, jsContent, 'utf8');
      console.log(`📄 Injected JS into ${jsFile}`);
    } catch (error) {
      console.error(`❌ Error injecting JS into ${jsFile}:`, error.message);
    }
  }

  // Create customization configuration file
  async createCustomizationConfig(outputDir, componentName, customization) {
    const configPath = path.join(outputDir, `src/config/${componentName}.config.js`);
    const configDir = path.dirname(configPath);
    
    await fs.mkdir(configDir, { recursive: true });
    
    const configContent = `
// Auto-generated customization config for ${componentName}
export default ${JSON.stringify(customization.customizations, null, 2)};
`;

    await fs.writeFile(configPath, configContent.trim(), 'utf8');
    console.log(`⚙️ Created config file: ${componentName}.config.js`);
  }

  // Generate deployment manifest
  async generateManifest(outputDir, userId, storeId) {
    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      userId,
      storeId,
      customizations: Array.from(this.customizations.entries()).map(([name, data]) => ({
        componentName: name,
        version: data.version,
        hasCustomCSS: !!data.customizations?.styles?.customCSS,
        hasCustomJS: !!data.customizations?.customJS,
      })),
      injectionPoints: Object.keys(this.injectionPoints),
    };

    const manifestPath = path.join(outputDir, 'customization-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('📋 Generated customization manifest');
  }

  // Copy directory recursively
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

module.exports = CustomizationInjector;