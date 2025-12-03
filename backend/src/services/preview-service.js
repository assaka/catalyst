/**
 * Preview Service
 * Handles server-side preview generation by fetching pages and applying changes
 */

const axios = require('axios');
const crypto = require('crypto');

class PreviewService {
  constructor() {
    this.previewCache = new Map(); // In-memory cache for preview sessions
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Create a preview session with code changes
   * @param {Object} params - Preview parameters
   * @returns {Object} Preview session data
   */
  async createPreviewSession(params) {
    const {
      storeId,
      fileName,
      originalCode,
      modifiedCode,
      language = 'javascript',
      targetPath = '/'
    } = params;

    try {
      console.log(`🔧 CUSTOMIZATION DEBUG: Should fetch customization with ID: e9d25cdd-39dd-4262-b152-9393a05d488c`);
      console.log(`🔧 CUSTOMIZATION DEBUG: Original code length: ${originalCode?.length || 0}`);
      console.log(`🔧 CUSTOMIZATION DEBUG: Modified code length: ${modifiedCode?.length || 0}`);
      console.log(`🔧 CUSTOMIZATION DEBUG: Should merge changes for file: ${fileName}`);

      // Generate unique session ID
      const sessionId = crypto.randomBytes(16).toString('hex');
      const expiresAt = Date.now() + this.cacheTimeout;

      // Store preview session data
      const sessionData = {
        sessionId,
        storeId,
        fileName,
        originalCode,
        modifiedCode,
        language,
        targetPath,
        createdAt: Date.now(),
        expiresAt
      };

      this.previewCache.set(sessionId, sessionData);

      // Clean up expired sessions
      this.cleanupExpiredSessions();

      console.log(`✅ Preview session created: ${sessionId} for ${fileName}`);
      
      return {
        success: true,
        sessionId,
        previewUrl: `/api/preview/render/${sessionId}`,
        expiresAt
      };

    } catch (error) {
      console.error('❌ Error creating preview session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Render preview content for a session
   * @param {string} sessionId - Preview session ID
   * @returns {Object} Rendered content
   */
  async renderPreview(sessionId) {
    try {
      // Get session data
      const session = this.previewCache.get(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Preview session not found or expired'
        };
      }

      // Check if session expired
      if (Date.now() > session.expiresAt) {
        this.previewCache.delete(sessionId);
        return {
          success: false,
          error: 'Preview session expired'
        };
      }

      // Fetch the original page
      const baseUrl = process.env.PUBLIC_STORE_BASE_URL || 'https://daino-pearl.vercel.app';
      
      // Handle store lookup with UUID validation
      let storeSlug = 'store'; // Default fallback
      let store = null;
      
      try {
        // Check if storeId looks like a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(session.storeId)) {
          const Store = require('../models/Store');
          store = await Store.findByPk(session.storeId);
          
          if (store) {
            storeSlug = store.slug || 'store';
            console.log(`🏪 Using store: ${store.name} (${storeSlug})`);
          } else {
            console.log(`⚠️ Store not found for UUID: ${session.storeId}, using default slug: ${storeSlug}`);
          }
        } else {
          console.log(`⚠️ Invalid store ID format: ${session.storeId}, using default slug: ${storeSlug}`);
        }
      } catch (error) {
        console.log(`⚠️ Store lookup failed: ${error.message}, using default slug: ${storeSlug}`);
      }

      // Determine the target URL  
      let targetUrl = `${baseUrl}/public/${storeSlug}${session.targetPath}`;
      
      // Add authentication bypass and preview params
      const urlParams = new URLSearchParams({
        storeId: session.storeId,
        preview: 'true',
        fileName: session.fileName,
        bypassAuth: 'true', // Signal to bypass authentication
        previewMode: 'true',
        _t: Date.now() // Cache busting
      });
      
      targetUrl += `?${urlParams.toString()}`;

      console.log(`🔍 Fetching original page: ${targetUrl}`);
      console.log(`🔍 Store info: name="${store?.name || 'No store'}", slug="${storeSlug}"`);
      console.log(`🔍 Session details:`, {
        sessionId: session.sessionId,
        targetPath: session.targetPath,
        storeId: session.storeId,
        fileName: session.fileName
      });

      // Try alternative URLs if the main one fails
      const fallbackUrls = [
        targetUrl, // Original URL with full path
        `${baseUrl}/public/${storeSlug}?${urlParams.toString()}`, // Base store URL
        `${baseUrl}/?storeId=${session.storeId}&path=${session.targetPath}`, // Root with store param
      ];

      // Fetch the original page content
      const response = await axios.get(targetUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'DainoStore Preview Service/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      console.log(`📊 HTTP Response: ${response.status} ${response.statusText}`);
      console.log(`📊 Content-Type: ${response.headers['content-type']}`);
      console.log(`📊 Content length: ${response.data?.length || 0} characters`);

      let htmlContent = response.data;

      // Remove any existing CSP headers that might block iframe embedding
      htmlContent = htmlContent.replace(
        /<meta[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/gi,
        ''
      );

      console.log(`🔧 Original HTML preview (first 200 chars):`, htmlContent.substring(0, 200));
      
      // Apply code changes to the HTML content
      const modifiedHtml = this.applyCodeChangesToHtml(htmlContent, session, { slug: storeSlug, store });

      console.log(`🔧 Modified HTML preview (first 200 chars):`, modifiedHtml.substring(0, 200));
      console.log(`🔧 HTML contains preview script:`, modifiedHtml.includes('__CATALYST_PREVIEW_MODE__'));
      console.log(`🔧 HTML contains store slug:`, modifiedHtml.includes(storeSlug));
      console.log(`✅ Applied preview changes to HTML (${modifiedHtml.length} chars)`);

      return {
        success: true,
        content: modifiedHtml,
        contentType: 'text/html; charset=utf-8',
        session: {
          id: sessionId,
          fileName: session.fileName,
          modifiedAt: Date.now()
        }
      };

    } catch (error) {
      console.error('❌ Error rendering preview:', error);
      return {
        success: false,
        error: `Failed to render preview: ${error.message}`
      };
    }
  }

  /**
   * Apply code changes to HTML content using server-side rendering
   * @param {string} htmlContent - Original HTML content (not used in new approach)
   * @param {Object} session - Preview session data
   * @param {Object} storeData - Store information
   * @returns {string} Complete preview HTML
   */
  applyCodeChangesToHtml(htmlContent, session, storeData = {}) {
    try {
      console.log(`🔧 ROUTE-SIM: Starting route simulation for ${session.fileName}`);
      console.log(`🔧 ROUTE-SIM: Due to authentication issues, switching to fallback preview`);
      
      // Since the real page requires authentication that we can't easily bypass,
      // use the fallback preview which is designed to work standalone
      return this.generateFallbackPreview(session, storeData, { message: 'Using fallback due to authentication requirements' });
      
    } catch (error) {
      console.error('❌ ROUTE-SIM: Error in route simulation:', error);
      return this.generateFallbackPreview(session, storeData, error);
    }
  }

  /**
   * Inject Cart.jsx customizations into the real page HTML
   * @param {string} htmlContent - Real page HTML
   * @param {string} mergedCode - Merged Cart component code
   * @param {Object} session - Session data
   * @param {Object} storeData - Store data
   * @returns {string} Enhanced HTML
   */
  injectCartCustomizations(htmlContent, mergedCode, session, storeData) {
    console.log(`🔧 INJECT: Injecting Cart customizations into real page`);
    
    // Step 1: Fix asset paths to point to original site instead of backend
    let modifiedHtml = htmlContent;
    
    // Replace relative asset paths with absolute URLs to the original site
    const baseUrl = process.env.PUBLIC_STORE_BASE_URL || 'https://daino-pearl.vercel.app';
    modifiedHtml = modifiedHtml.replace(
      /href="\/assets\//g, 
      `href="${baseUrl}/assets/`
    );
    modifiedHtml = modifiedHtml.replace(
      /src="\/assets\//g, 
      `src="${baseUrl}/assets/`
    );
    
    // Step 2: Add our customization script before the existing React scripts load
    const customizationScript = `<script>
      console.log('🔧 CART-CUSTOM: Cart customizations loading');
      
      // Store the merged Cart component code for the app to use  
      window.__CATALYST_CART_CUSTOMIZATIONS__ = {
        sessionId: '${session.sessionId}',
        fileName: '${session.fileName}',
        mergedCode: ${JSON.stringify(mergedCode).replace(/\n/g, '\\n').replace(/\r/g, '\\r')},
        targetPath: '${session.targetPath}',
        appliedAt: Date.now()
      };
      
      // Flag that this is a preview with customizations
      window.__CATALYST_PREVIEW_MODE__ = true;
      
      console.log('🔧 CART-CUSTOM: Customizations ready for React app');
    </script>`;
    
    // Step 3: Insert the script before the main React script loads
    
    // Find the main React script and inject our customization script before it
    if (modifiedHtml.includes('<script')) {
      modifiedHtml = modifiedHtml.replace(
        /<script[^>]*src=["'][^"']*assets\/index-[^"']*\.js["'][^>]*><\/script>/,
        customizationScript + '$&'
      );
      console.log(`🔧 INJECT: Injected customization script before React app loads`);
    } else {
      // Fallback: inject before closing head
      modifiedHtml = modifiedHtml.replace('</head>', customizationScript + '</head>');
      console.log(`🔧 INJECT: Fallback injection before </head>`);
    }
    
    // Step 3: Add preview indicator
    const previewIndicator = `
    <div id="daino-preview-indicator" style="
      position: fixed;
      top: 10px;
      right: 10px;
      background: #3b82f6;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    ">
      👁 Preview: ${session.fileName}
    </div>
    `;
    
    modifiedHtml = modifiedHtml.replace('</body>', previewIndicator + '</body>');
    
    console.log(`🔧 INJECT: Added preview indicator`);
    return modifiedHtml;
  }

  /**
   * Merge original and modified code to produce final result
   * @param {string} originalCode - Original code content
   * @param {string} modifiedCode - Modified code content  
   * @param {string} fileName - File name for context
   * @returns {string} Merged code
   */
  mergeCodeChanges(originalCode, modifiedCode, fileName) {
    try {
      console.log(`🔀 MERGE: Starting code merge for ${fileName}`);
      
      // For now, since both codes are the same length, use the modified code as the result
      // In future, this could implement proper diff-based merging
      if (originalCode === modifiedCode) {
        console.log(`🔀 MERGE: No changes detected, using original code`);
        return originalCode;
      }
      
      console.log(`🔀 MERGE: Changes detected, using modified code as final result`);
      console.log(`🔀 MERGE: Original: ${originalCode?.length || 0} chars, Modified: ${modifiedCode?.length || 0} chars`);
      
      // Return the modified code as the merged result
      // TODO: In future versions, implement proper 3-way merge with conflict resolution
      return modifiedCode || originalCode || '';
      
    } catch (error) {
      console.error('❌ MERGE: Error merging code changes:', error);
      return modifiedCode || originalCode || '';
    }
  }

  /**
   * Generate fallback preview when route simulation fails
   * @param {Object} session - Session data
   * @param {Object} storeData - Store data  
   * @param {Error} error - Error that occurred
   * @returns {string} Fallback HTML
   */
  generateFallbackPreview(session, storeData, error) {
    // Get merged code for the preview
    const mergedCode = this.mergeCodeChanges(session.originalCode, session.modifiedCode, session.fileName);
    
    // Escape HTML helper function
    function escapeHtml(unsafe) {
      return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    try {
      const previewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://www.suprshop.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview: ${session.fileName}</title>
    <!-- Load actual CSS from the live cart page -->
    <link rel="stylesheet" crossorigin href="https://daino-pearl.vercel.app/assets/index-DsosPPHy.css">
    
    <style>
      /* Reset and base styles for preview */
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f8f9fa;
        line-height: 1.6;
      }
      
      /* Hide preview-specific elements when showing real cart */
      .preview-container .info-card {
        display: none;
      }
      
      /* Make cart preview full width like real site */
      #react-preview-container {
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 100vh !important;
      }
      
      #react-mount-point {
        padding: 0 !important;
      }
      .preview-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        min-height: 100vh;
      }
      .preview-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #3b82f6;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .info-card, .code-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 24px;
        margin-bottom: 20px;
      }
      .info-card h1 {
        margin: 0 0 16px 0;
        color: #1f2937;
        font-size: 28px;
        font-weight: bold;
      }
      .info-card p {
        margin: 0;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .code-card h2 {
        margin: 0 0 16px 0;
        color: #1f2937;
        font-size: 20px;
        font-weight: 600;
      }
      .code-preview {
        background: #f3f4f6;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        font-size: 14px;
        line-height: 1.5;
        color: #374151;
        margin: 0;
        max-height: 600px;
        overflow-y: auto;
        border: 1px solid #e5e7eb;
      }
      .diff-indicator {
        background: #ecfdf5;
        border: 1px solid #10b981;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 16px;
        color: #065f46;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="preview-indicator">
      👁 Preview Mode
    </div>
    
    <div class="preview-container">
      <!-- Full-screen cart preview matching real site -->
      <div id="react-preview-container" style="
        border: none;
        border-radius: 0;
        background: white;
        min-height: 100vh;
        position: relative;
        width: 100%;
        margin: 0;
        padding: 0;
      ">
        <div id="react-mount-point" style="padding: 0; width: 100%;">
          <div style="text-align: center; padding: 40px; color: #6b7280;" id="loading-placeholder">
            <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
            <div style="font-size: 18px; margin-bottom: 8px;">Loading Cart Component...</div>
            <div style="font-size: 14px;">Matching hamid2 store layout</div>
          </div>
        </div>
      </div>
      
      <!-- Info card shown only when cart fails to load -->
      <div class="info-card" id="fallback-info" style="display: none;">
        <h1>Preview: ${session.fileName}</h1>
        <p><strong>Target Path:</strong> ${session.targetPath}</p>
        <p><strong>Store:</strong> hamid2</p>
        <p><strong>Session ID:</strong> ${session.sessionId}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="code-card">
        <h2>🔗 Merged Code Result</h2>
        <div class="diff-indicator">
          ✨ Final code with your modifications applied (${mergedCode.length} characters)
        </div>
        <pre class="code-preview">${escapeHtml(mergedCode)}</pre>
      </div>
      
      <details style="margin-top: 20px;">
        <summary style="cursor: pointer; padding: 10px; background: #f3f4f6; border-radius: 4px;">
          📋 View Original vs Modified Code Comparison
        </summary>
        <div style="margin-top: 16px;">
          <div class="code-card">
            <h3>Modified Code (${session.modifiedCode?.length || 0} chars)</h3>
            <pre class="code-preview" style="max-height: 300px;">${escapeHtml(session.modifiedCode?.substring(0, 3000) + (session.modifiedCode?.length > 3000 ? '...' : '') || 'No code available')}</pre>
          </div>
          
          <div class="code-card">
            <h3>Original Code (${session.originalCode?.length || 0} chars)</h3>
            <pre class="code-preview" style="max-height: 300px;">${escapeHtml(session.originalCode?.substring(0, 3000) + (session.originalCode?.length > 3000 ? '...' : '') || 'No original code available')}</pre>
          </div>
        </div>
      </details>
    </div>

    <!-- React Runtime Dependencies -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <script>
      console.log('🎬 SERVER-SIDE: Preview rendered successfully');
      console.log('📁 File:', '${session.fileName}');
      console.log('🔧 Code Length:', ${session.modifiedCode?.length || 0});
      console.log('🔄 Target Path:', '${session.targetPath}');
      
      // Set preview data for any client-side components that might need it
      window.__CATALYST_PREVIEW_MODE__ = true;
      window.__CATALYST_PREVIEW_DATA__ = ${JSON.stringify({
        sessionId: session.sessionId,
        fileName: session.fileName,
        targetPath: session.targetPath,
        appliedAt: Date.now()
      })};

      // React Component Rendering Setup
      const { React, ReactDOM } = window;
      const { useState, useEffect, useCallback, useMemo } = React;
      
      // Mock dependencies that Cart component needs
      const mockDependencies = {
        // React Router
        useNavigate: () => (path) => console.log('Navigate to:', path),
        Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children),
        
        // Store context with real hamid2 data
        useStore: () => ({
          store: { 
            id: '${storeData.store?.id || '8cc01a01-3a78-4f20-beb8-a566a07834e5'}', 
            name: '${storeData.store?.name || 'hamid2'}', 
            slug: 'hamid2'
          },
          settings: {
            currency_symbol: '🔴16',
            currency: 'USD'
          },
          taxes: [],
          selectedCountry: 'US',
          loading: false
        }),
        
        // Mock services with sample cart data
        cartService: {
          getCart: () => Promise.resolve({ 
            success: true, 
            items: [
              {
                id: 'cart-item-1',
                product_id: 'product-1',
                quantity: 2,
                price: 29.99,
                selected_options: [],
                product: {
                  id: 'product-1',
                  name: 'Premium T-Shirt',
                  price: 29.99,
                  sale_price: 29.99,
                  image_url: 'https://via.placeholder.com/150x150?text=Product+1',
                  category_ids: ['cat-1']
                }
              },
              {
                id: 'cart-item-2',
                product_id: 'product-2',
                quantity: 1,
                price: 45.00,
                selected_options: [{ name: 'Size', value: 'Large', price: 0 }],
                product: {
                  id: 'product-2',
                  name: 'Designer Jacket',
                  price: 45.00,
                  sale_price: 45.00,
                  image_url: 'https://via.placeholder.com/150x150?text=Product+2',
                  category_ids: ['cat-2']
                }
              }
            ]
          }),
          updateCart: () => Promise.resolve({ success: true })
        },
        couponService: {
          getAppliedCoupon: () => null,
          addListener: () => () => {},
          setAppliedCoupon: () => ({ success: true }),
          removeAppliedCoupon: () => ({ success: true })
        },
        taxService: {
          calculateTax: () => ({ taxAmount: 0 })
        },
        
        // Mock UI components
        Button: ({ children, onClick, ...props }) => 
          React.createElement('button', { onClick, style: { padding: '8px 16px', margin: '4px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f9fa', cursor: 'pointer' }, ...props }, children),
        Input: ({ ...props }) => 
          React.createElement('input', { style: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }, ...props }),
        Card: ({ children }) => 
          React.createElement('div', { style: { border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' } }, children),
        CardContent: ({ children }) => 
          React.createElement('div', { style: { padding: '16px' } }, children),
        CardHeader: ({ children }) => 
          React.createElement('div', { style: { padding: '16px', borderBottom: '1px solid #e5e7eb' } }, children),
        CardTitle: ({ children }) => 
          React.createElement('h3', { style: { margin: 0, fontSize: '18px', fontWeight: '600' } }, children),
        
        // Mock icons
        Trash2: () => React.createElement('span', null, '🗑️'),
        Plus: () => React.createElement('span', null, '➕'),
        Minus: () => React.createElement('span', null, '➖'),
        Tag: () => React.createElement('span', null, '🏷️'),
        ShoppingCart: () => React.createElement('span', null, '🛒'),
        
        // Mock utility functions
        formatDisplayPrice: (price) => \`$\${(price || 0).toFixed(2)}\`,
        calculateDisplayPrice: (price) => price || 0,
        createPageUrl: (path) => path,
        createPublicUrl: (path) => path,
        getExternalStoreUrl: (slug, path, base) => \`\${base || ''}/\${slug}\${path || ''}\`,
        getStoreBaseUrl: (store) => 'https://preview.example.com'
      };
      
      // Mock API entities
      window.StorefrontProduct = { filter: () => Promise.resolve([]) };
      window.Coupon = { filter: () => Promise.resolve([]) };
      window.Tax = { filter: () => Promise.resolve([]) };
      window.User = { filter: () => Promise.resolve([]) };
      
      // Mock components
      window.RecommendedProducts = () => React.createElement('div', { style: { padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' } }, 'Recommended Products Section');
      window.FlashMessage = ({ message }) => message ? React.createElement('div', { style: { padding: '10px', background: '#dff0d8', border: '1px solid #d6e9c6', borderRadius: '4px', marginBottom: '10px' } }, message.message) : null;
      window.SeoHeadManager = () => null;
      window.CmsBlockRenderer = ({ position }) => React.createElement('div', { style: { padding: '10px', background: '#e7f3ff', borderRadius: '4px', margin: '10px 0', fontSize: '12px' } }, \`CMS Block: \${position}\`);
      
      // Initialize actual Cart component rendering
      async function initializeReactPreview() {
        try {
          console.log('🚀 REACT: Initializing actual Cart component preview');
          
          const mountPoint = document.getElementById('react-mount-point');
          const loadingPlaceholder = document.getElementById('loading-placeholder');
          
          if (!mountPoint) {
            console.error('❌ REACT: Mount point not found');
            return;
          }
          
          // Remove loading placeholder
          if (loadingPlaceholder) {
            loadingPlaceholder.remove();
          }
          
          console.log('🔧 REACT: Compiling actual Cart.jsx component');
          
          // Get the merged code (actual Cart component)
          const cartComponentCode = \`${mergedCode.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;
          
          console.log('🔧 REACT: Cart component code length:', cartComponentCode.length);
          
          try {
            // Transform the Cart component code to work in browser environment
            let transformedCode = cartComponentCode;
            
            // Collect all needed dependencies to avoid duplicates
            const dependencies = new Set();
            let imports = [];
            
            // Extract React hooks
            const reactHookMatches = transformedCode.match(/import.*?{([^}]+)}.*?from ['"]react['"];?/g);
            if (reactHookMatches) {
              reactHookMatches.forEach(match => {
                const hooks = match.match(/{([^}]+)}/)[1].split(',').map(h => h.trim());
                hooks.forEach(hook => dependencies.add(hook));
              });
            }
            
            // Build import replacements without duplicates
            const reactHooks = Array.from(dependencies).join(', ');
            
            // Replace ES6 imports with global references (avoiding duplicates)
            transformedCode = transformedCode
              // Remove all import statements first
              .replace(/import.*?['"][^'"]*['"];?\\n?/g, '')
              
              // Fix export
              .replace(/export default function Cart/g, 'function Cart')
              .replace(/export default Cart/g, '// Cart component defined above');
            
            // Add single consolidated import block at the top
            const importBlock = \`
              // Consolidated imports to avoid duplicates
              \${reactHooks ? \`const {\${reactHooks}} = React;\` : ''}
              const useNavigate = mockDependencies.useNavigate;
              const Link = mockDependencies.Link;
              const useStore = mockDependencies.useStore;
              const cartService = mockDependencies.cartService;
              const couponService = mockDependencies.couponService;
              const taxService = mockDependencies.taxService;
              const { Button } = mockDependencies;
              const { Input } = mockDependencies;
              const { Card, CardContent, CardHeader, CardTitle } = mockDependencies;
              const { Trash2, Plus, Minus, Tag, ShoppingCart } = mockDependencies;
              const { formatDisplayPrice, calculateDisplayPrice } = mockDependencies;
              const { createPageUrl, createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } = mockDependencies;
              const RecommendedProducts = window.RecommendedProducts;
              const FlashMessage = window.FlashMessage;
              const SeoHeadManager = window.SeoHeadManager;
              const CmsBlockRenderer = window.CmsBlockRenderer;
              const { StorefrontProduct } = window;
              const { Coupon } = window;
              const { Tax } = window;
              const { User } = window;
            \`;
            
            transformedCode = importBlock + transformedCode;
            
            console.log('🔧 REACT: Transforming JSX to createElement calls using Babel');
            
            // Check if Babel is available
            if (typeof Babel === 'undefined') {
              throw new Error('Babel is not loaded. Cannot transform JSX.');
            }
            
            // Use Babel to transform JSX to React.createElement calls
            const babelTransformed = Babel.transform(transformedCode, {
              presets: [['react', { pragma: 'React.createElement' }]],
              plugins: []
            }).code;
            
            console.log('🔧 REACT: JSX transformed successfully');
            console.log('🔧 REACT: Transformed code preview (first 500 chars):', babelTransformed.substring(0, 500));
            
            // Create a function that returns the Cart component
            const componentFactory = new Function('React', 'mockDependencies', 'window', \`
              \${babelTransformed}
              return Cart;
            \`);
            
            // Get the Cart component
            const CartComponent = componentFactory(React, mockDependencies, window);
            
            console.log('🔧 REACT: Cart component compiled successfully');
            
            // Render the actual Cart component
            const root = ReactDOM.createRoot(mountPoint);
            root.render(React.createElement(CartComponent));
            
            console.log('✅ REACT: Actual Cart component rendered successfully');
            
          } catch (compileError) {
            console.error('❌ REACT: Error compiling Cart component:', compileError);
            
            // Fallback to demo preview with error message
            const fallbackComponent = () => {
              return React.createElement('div', {
                style: { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }
              }, [
                React.createElement('div', {
                  key: 'error-header',
                  style: {
                    background: '#dc2626',
                    color: 'white', 
                    padding: '12px 16px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '14px'
                  }
                }, '❌ Cart Component Compilation Error'),
                
                React.createElement('div', {
                  key: 'error-details',
                  style: {
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#991b1b'
                  }
                }, \`Error: \${compileError.message}\`),
                
                React.createElement('div', {
                  key: 'fallback-info',
                  style: {
                    background: '#f3f4f6',
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }
                }, [
                  React.createElement('h3', { key: 'title' }, 'Cart Component Preview'),
                  React.createElement('p', { key: 'desc' }, 'Unable to compile the Cart component for live preview. The merged code is available below.'),
                ])
              ]);
            };
            
            const root = ReactDOM.createRoot(mountPoint);
            root.render(React.createElement(fallbackComponent));
          }
          
        } catch (error) {
          console.error('❌ REACT: Error rendering preview:', error);
          const mountPoint = document.getElementById('react-mount-point');
          if (mountPoint) {
            mountPoint.innerHTML = \`
              <div style="text-align: center; padding: 40px; color: #dc2626;">
                <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                <div style="font-size: 18px; margin-bottom: 8px;">Preview Error</div>
                <div style="font-size: 14px;">Failed to render component: \${error.message}</div>
              </div>
            \`;
          }
        }
      }
      
      // Wait for DOM and React to load, then initialize
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReactPreview);
      } else {
        // Add small delay to ensure React libraries are loaded
        setTimeout(initializeReactPreview, 100);
      }
    </script>
  </body>
</html>`;

      console.log(`✅ SERVER-SIDE: Generated complete preview HTML (${previewHtml.length} chars)`);
      return previewHtml;

    } catch (error) {
      console.error('❌ SERVER-SIDE: Error generating preview HTML:', error);
      return `<!doctype html>
<html>
<head><title>Preview Error</title></head>
<body>
  <h1>Preview Error</h1>
  <p>Failed to generate preview: ${error.message}</p>
</body>
</html>`;
    }
  }

  /**
   * Get preview session info
   * @param {string} sessionId - Session ID
   * @returns {Object} Session info
   */
  getSessionInfo(sessionId) {
    const session = this.previewCache.get(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return {
      success: true,
      session: {
        id: session.sessionId,
        fileName: session.fileName,
        language: session.language,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        timeRemaining: Math.max(0, session.expiresAt - Date.now())
      }
    };
  }

  /**
   * Clean up expired preview sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.previewCache.entries()) {
      if (now > session.expiresAt) {
        this.previewCache.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired preview sessions`);
    }
  }

  /**
   * Get preview statistics
   * @returns {Object} Preview stats
   */
  getStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;

    for (const session of this.previewCache.values()) {
      if (now > session.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      activeSessions: activeCount,
      expiredSessions: expiredCount,
      totalSessions: this.previewCache.size,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Export singleton instance
const previewService = new PreviewService();

// Auto-cleanup every minute
setInterval(() => {
  previewService.cleanupExpiredSessions();
}, 60000);

module.exports = previewService;