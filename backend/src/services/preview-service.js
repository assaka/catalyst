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
      const baseUrl = process.env.PUBLIC_STORE_BASE_URL || 'https://catalyst-pearl.vercel.app';
      
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
      
      // Add original query params to maintain context and enable preview mode
      const urlParams = new URLSearchParams({
        storeId: session.storeId,
        preview: 'true',
        fileName: session.fileName,
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
          'User-Agent': 'Catalyst Preview Service/1.0',
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
      const modifiedHtml = this.applyCodeChangesToHtml(htmlContent, session);

      console.log(`🔧 Modified HTML preview (first 200 chars):`, modifiedHtml.substring(0, 200));
      console.log(`🔧 HTML contains preview script:`, modifiedHtml.includes('__CATALYST_PREVIEW_MODE__'));
      console.log(`🔧 HTML contains store slug:`, modifiedHtml.includes(storeSlug));
      console.log(`✅ Applied preview changes to HTML (${modifiedHtml.length} chars)`);

      return {
        success: true,
        content: modifiedHtml,
        contentType: 'text/html',
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
   * Apply code changes to HTML content
   * @param {string} htmlContent - Original HTML content
   * @param {Object} session - Preview session data
   * @returns {string} Modified HTML content
   */
  applyCodeChangesToHtml(htmlContent, session) {
    try {
      console.log(`🛠️  Starting HTML modification for session ${session.sessionId}`);
      console.log(`🛠️  Session data:`, {
        fileName: session.fileName,
        targetPath: session.targetPath,
        hasOriginalCode: !!session.originalCode,
        hasModifiedCode: !!session.modifiedCode,
        originalCodeLength: session.originalCode?.length || 0,
        modifiedCodeLength: session.modifiedCode?.length || 0
      });

      // Fix asset URLs to point to frontend server
      const frontendUrl = process.env.PUBLIC_STORE_BASE_URL || 'https://catalyst-pearl.vercel.app';
      console.log(`🛠️  Using frontend URL: ${frontendUrl}`);
      
      // Replace relative asset URLs with absolute URLs pointing to frontend
      htmlContent = htmlContent.replace(
        /src=["']\/assets\//g, 
        `src="${frontendUrl}/assets/`
      );
      htmlContent = htmlContent.replace(
        /href=["']\/assets\//g, 
        `href="${frontendUrl}/assets/`
      );
      
      // Also fix any other relative URLs that might break
      htmlContent = htmlContent.replace(
        /src=["']\//g, 
        `src="${frontendUrl}/`
      );
      htmlContent = htmlContent.replace(
        /href=["']\//g, 
        `href="${frontendUrl}/`
      );
      
      console.log(`🔧 Fixed asset URLs to point to ${frontendUrl}`);

      // Inject preview metadata and modified code into the HTML
      console.log(`🛠️  Generating preview script for injection`);
      const previewScript = `
        <script>
          // Catalyst Preview Mode
          console.log('🎬 Catalyst Preview Mode activated');
          window.__CATALYST_PREVIEW_MODE__ = true;
          window.__CATALYST_PREVIEW_DATA__ = ${JSON.stringify({
            sessionId: session.sessionId,
            fileName: session.fileName,
            originalCode: session.originalCode,
            modifiedCode: session.modifiedCode,
            language: session.language,
            appliedAt: Date.now()
          })};
          
          // Override window.location to show correct route for React Router
          const originalLocation = window.location.href;
          const targetPath = '${session.targetPath}';
          const storeSlug = '${store.slug}';
          const frontendPath = '/public/' + storeSlug + targetPath;
          
          // Update browser history to show correct URL for React Router
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', frontendPath + window.location.search);
          }
          
          // Apply preview changes when DOM is ready
          document.addEventListener('DOMContentLoaded', function() {
            console.log('🎬 Catalyst Preview Mode Active');
            console.log('📁 File:', '${session.fileName}');
            console.log('🔧 Modified Code Length:', ${session.modifiedCode?.length || 0});
            console.log('🔄 React Router Path:', frontendPath);
            
            // Dispatch preview event for components to listen to
            window.dispatchEvent(new CustomEvent('catalystPreviewReady', {
              detail: window.__CATALYST_PREVIEW_DATA__
            }));
            
            // Add preview indicator
            const indicator = document.createElement('div');
            indicator.innerHTML = \`
              <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: #3b82f6;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                font-size: 12px;
                font-weight: 500;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              ">
                👁 Preview: \${window.__CATALYST_PREVIEW_DATA__.fileName}
              </div>
            \`;
            document.body.appendChild(indicator);
          });
        </script>
      `;

      // Inject the preview script before the closing head tag or body tag
      console.log(`🛠️  Injecting preview script...`);
      console.log(`🛠️  HTML contains </head>:`, htmlContent.includes('</head>'));
      console.log(`🛠️  HTML contains </body>:`, htmlContent.includes('</body>'));
      
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${previewScript}</head>`);
        console.log(`🛠️  Injected script before </head>`);
      } else if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${previewScript}</body>`);
        console.log(`🛠️  Injected script before </body>`);
      } else {
        // Fallback: append to end of content
        htmlContent = htmlContent + previewScript;
        console.log(`🛠️  Fallback: appended script to end of content`);
      }

      // Add preview mode CSS
      const previewStyles = `
        <style>
          /* Catalyst Preview Mode Styles */
          [data-catalyst-preview] {
            outline: 2px dashed #3b82f6;
            outline-offset: 2px;
          }
          
          [data-catalyst-preview]:hover {
            outline-color: #1d4ed8;
            background-color: rgba(59, 130, 246, 0.05);
          }
        </style>
      `;

      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${previewStyles}</head>`);
      } else {
        htmlContent = previewStyles + htmlContent;
      }

      console.log(`✅ Applied preview changes to HTML (${htmlContent.length} chars)`);
      return htmlContent;

    } catch (error) {
      console.error('❌ Error applying code changes to HTML:', error);
      return htmlContent; // Return original content on error
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