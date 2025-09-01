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
   * Apply code changes to HTML content using server-side rendering
   * @param {string} htmlContent - Original HTML content (not used in new approach)
   * @param {Object} session - Preview session data
   * @param {Object} storeData - Store information
   * @returns {string} Complete preview HTML
   */
  applyCodeChangesToHtml(htmlContent, session, storeData = {}) {
    try {
      console.log(`🔧 SERVER-SIDE: Starting server-side code merging for ${session.fileName}`);
      
      // Step 1: Merge the code changes
      const mergedCode = this.mergeCodeChanges(session.originalCode, session.modifiedCode, session.fileName);
      console.log(`🔧 SERVER-SIDE: Code merged successfully (${mergedCode.length} chars)`);
      
      // Helper function to escape HTML
      const escapeHtml = (text) => {
        if (!text) return '';
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Create the complete preview HTML server-side
      const previewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://www.suprshop.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview: ${session.fileName}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f8f9fa;
        line-height: 1.6;
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
      <div class="info-card">
        <h1>Preview: ${session.fileName}</h1>
        <p><strong>Target Path:</strong> ${session.targetPath}</p>
        <p><strong>Store:</strong> ${storeData.slug || 'Unknown'}</p>
        <p><strong>Session ID:</strong> ${session.sessionId}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="code-card">
        <h2>🎯 Visual Preview</h2>
        <div class="diff-indicator">
          🚀 Live Cart component with your modifications applied
        </div>
        <div id="react-preview-container" style="
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: white;
          min-height: 400px;
          position: relative;
        ">
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
            <div style="font-size: 18px; margin-bottom: 8px;">Cart Component Preview</div>
            <div style="font-size: 14px;">Your Cart.jsx modifications will render here</div>
          </div>
        </div>
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