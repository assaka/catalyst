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
      const modifiedHtml = this.applyCodeChangesToHtml(htmlContent, session, { slug: storeSlug, store });

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
  applyCodeChangesToHtml(htmlContent, session, storeData = {}) {
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

      console.log(`🛠️  Removing React scripts and creating standalone preview`);
      
      // Remove all script tags that load the React app
      htmlContent = htmlContent.replace(
        /<script[^>]*src=["'][^"']*\.js["'][^>]*><\/script>/gi,
        ''
      );
      
      // Remove all CSS imports from the React app  
      htmlContent = htmlContent.replace(
        /<link[^>]*rel=["']stylesheet["'][^>]*>/gi,
        ''
      );
      
      console.log(`🔧 Removed React scripts and stylesheets`);

      // Inject preview metadata and modified code into the HTML
      console.log(`🛠️  Generating preview script for injection`);
      const previewScript = `
        <script>
          // Catalyst Preview Mode
          console.log('🎬 STEP 1: Catalyst Preview Mode script starting');
          window.__CATALYST_PREVIEW_MODE__ = true;
          console.log('🎬 STEP 2: Preview mode flag set');
          
          window.__CATALYST_PREVIEW_DATA__ = ${JSON.stringify({
            sessionId: session.sessionId,
            fileName: session.fileName,
            originalCode: session.originalCode,
            modifiedCode: session.modifiedCode,
            language: session.language,
            appliedAt: Date.now()
          })};
          console.log('🎬 STEP 3: Preview data set:', window.__CATALYST_PREVIEW_DATA__);
          
          // Instead of routing, create a simple preview content
          console.log('🎬 STEP 4: Creating preview content for ${session.fileName}');
          
          // Check if DOM is already loaded
          console.log('🎬 STEP 5: DOM ready state:', document.readyState);
          
          function initPreview() {
            console.log('🎬 STEP 6: initPreview function called');
            console.log('📁 STEP 7: File:', '${session.fileName}');
            console.log('🔧 STEP 8: Modified Code Length:', ${session.modifiedCode?.length || 0});
            console.log('🔄 STEP 9: Target Path:', '${session.targetPath}');
            
            // Dispatch preview event for components to listen to
            console.log('🎬 STEP 10: Dispatching catalystPreviewReady event');
            window.dispatchEvent(new CustomEvent('catalystPreviewReady', {
              detail: window.__CATALYST_PREVIEW_DATA__
            }));
            
            // Replace body with preview content
            console.log('🎬 STEP 11: Replacing body content with preview');
            console.log('🎬 STEP 12: Current body content before replacement:', document.body.innerHTML.substring(0, 200));
            
            document.body.innerHTML = \`
              <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: #f8f9fa;
                min-height: 100vh;
              ">
                <div style="
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
                ">
                  👁 Preview Mode
                </div>
                
                <div style="
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  padding: 24px;
                  margin-bottom: 20px;
                ">
                  <h1 style="margin: 0 0 16px 0; color: #1f2937;">Preview: ${session.fileName}</h1>
                  <p style="margin: 0; color: #6b7280;">Target Path: ${session.targetPath}</p>
                  <p style="margin: 8px 0 0 0; color: #6b7280;">Store: ${storeData.slug || 'Unknown'}</p>
                </div>
                
                <div style="
                  background: white;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  padding: 24px;
                ">
                  <h2 style="margin: 0 0 16px 0; color: #1f2937;">Modified Code</h2>
                  <pre style="
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
                    max-height: 500px;
                    overflow-y: auto;
                  ">\${window.__CATALYST_PREVIEW_DATA__.modifiedCode}</pre>
                </div>
              </div>
            \`;
            
            console.log('🎬 STEP 13: Body content replaced successfully');
            console.log('🎬 STEP 14: New body content preview:', document.body.innerHTML.substring(0, 200));
          }
          
          // Apply preview changes when DOM is ready
          if (document.readyState === 'loading') {
            console.log('🎬 STEP 5A: DOM still loading, adding listener');
            document.addEventListener('DOMContentLoaded', function() {
              console.log('🎬 STEP 5B: DOMContentLoaded event fired');
              initPreview();
            });
          } else {
            console.log('🎬 STEP 5C: DOM already loaded, calling initPreview immediately');
            initPreview();
          }
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