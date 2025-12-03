/**
 * Hello World Example Plugin
 * 
 * This plugin demonstrates how store owners can create custom plugins
 * that display content on their storefront.
 * 
 * Features:
 * - Customizable message text
 * - Custom colors and styling
 * - Animation effects
 * - Store name integration
 * - Configuration validation
 * 
 * @author Store Owner
 * @version 1.0.0
 */

class HelloWorldExamplePlugin {
  constructor() {
    this.name = 'Hello World Example';
    this.version = '1.0.0';
  }

  /**
   * Render content for homepage_header hook
   * @param {Object} config - Plugin configuration from store owner
   * @param {Object} context - Rendering context (store, user, etc.)
   * @returns {string} HTML content to display
   */
  renderHomepageHeader(config, context) {
    // Get configuration with defaults
    const {
      message = 'Hello World!',
      backgroundColor = '#f0f8ff',
      textColor = '#333333',
      showStoreName = true,
      animationType = 'fade',
      position = 'center'
    } = config;

    // Build the display message
    let displayMessage = message;
    if (showStoreName && context.store && context.store.name) {
      displayMessage += ` Welcome to ${context.store.name}!`;
    }

    // Animation CSS classes
    const animationClass = this.getAnimationClass(animationType);
    
    // Generate unique ID for this instance
    const instanceId = `hello-world-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return `
      <div id="${instanceId}" class="hello-world-plugin ${animationClass}" style="
        background: linear-gradient(135deg, ${backgroundColor}, ${this.adjustColor(backgroundColor, -10)});
        color: ${textColor};
        padding: 20px;
        text-align: ${position};
        margin: 15px 0;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s ease;
        border: 1px solid ${this.adjustColor(backgroundColor, -20)};
      ">
        <h3 style="
          margin: 0 0 10px 0; 
          font-size: 1.8em; 
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        ">
          ${this.escapeHTML(displayMessage)}
        </h3>
        <p style="
          margin: 0; 
          opacity: 0.8;
          font-size: 1em;
          line-height: 1.4;
        ">
          This message was created by a store owner using the DainoStore Plugin Builder! 🎉
        </p>
        <small style="
          display: block;
          margin-top: 10px;
          opacity: 0.6;
          font-size: 0.8em;
        ">
          Plugin: ${this.name} v${this.version}
        </small>
      </div>
      
      <style>
        .hello-world-plugin:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .hello-world-fade {
          animation: hello-world-fade-in 1s ease-out;
        }
        
        .hello-world-slide {
          animation: hello-world-slide-in 0.8s ease-out;
        }
        
        .hello-world-bounce {
          animation: hello-world-bounce-in 1.2s ease-out;
        }
        
        @keyframes hello-world-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes hello-world-slide-in {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes hello-world-bounce-in {
          0% { 
            opacity: 0; 
            transform: scale(0.5); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.05); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @media (max-width: 768px) {
          .hello-world-plugin {
            margin: 10px 0;
            padding: 15px;
          }
          .hello-world-plugin h3 {
            font-size: 1.5em;
          }
        }
      </style>
    `;
  }

  /**
   * Render content for homepage_content hook
   * @param {Object} config - Plugin configuration
   * @param {Object} context - Rendering context
   * @returns {string} HTML content
   */
  renderHomepageContent(config, context) {
    const {
      message = 'Hello World!',
      backgroundColor = '#f0f8ff',
      textColor = '#333333',
      position = 'center'
    } = config;

    // This demonstrates a different layout for content area
    return `
      <div class="hello-world-content-block" style="
        background: ${backgroundColor};
        color: ${textColor};
        padding: 30px;
        text-align: ${position};
        margin: 20px 0;
        border-radius: 8px;
        border-left: 4px solid ${this.adjustColor(backgroundColor, -30)};
      ">
        <div style="max-width: 600px; margin: 0 auto;">
          <h4 style="margin: 0 0 15px 0; color: ${this.adjustColor(textColor, -20)};">
            📦 Plugin Content Area
          </h4>
          <p style="margin: 0 0 10px 0; font-size: 1.1em;">
            ${this.escapeHTML(message)}
          </p>
          <p style="margin: 0; font-size: 0.9em; opacity: 0.7;">
            This content appears in the main homepage content area and can be styled differently.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Helper method to get animation CSS class
   * @param {string} animationType 
   * @returns {string}
   */
  getAnimationClass(animationType) {
    switch (animationType) {
      case 'fade': return 'hello-world-fade';
      case 'slide': return 'hello-world-slide';
      case 'bounce': return 'hello-world-bounce';
      default: return '';
    }
  }

  /**
   * Helper method to adjust color brightness
   * @param {string} color - Hex color
   * @param {number} amount - Amount to adjust (-100 to 100)
   * @returns {string}
   */
  adjustColor(color, amount) {
    // Simple color adjustment - in a real plugin you might use a color library
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    
    if (col.length !== 6) return color;
    
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
  }

  /**
   * Helper method to escape HTML to prevent XSS
   * @param {string} str 
   * @returns {string}
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[match]));
  }

  /**
   * Plugin lifecycle method - called when plugin is enabled
   */
  onEnable() {
    console.log(`${this.name} plugin enabled`);
  }

  /**
   * Plugin lifecycle method - called when plugin is disabled
   */
  onDisable() {
    console.log(`${this.name} plugin disabled`);
  }

  /**
   * Plugin lifecycle method - called when configuration changes
   */
  onConfigUpdate(newConfig, oldConfig) {
    console.log(`${this.name} configuration updated`, { newConfig, oldConfig });
  }
}

module.exports = HelloWorldExamplePlugin;