/**
 * New server-side code merging approach for Preview Service
 */

const newApplyCodeChangesToHtml = (htmlContent, session, storeData = {}) => {
  try {
    console.log(`🔧 SERVER-SIDE: Starting server-side code merging for ${session.fileName}`);
    
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
        <h2>Modified Code</h2>
        <div class="diff-indicator">
          ✨ Showing modifications for ${session.fileName} (${session.modifiedCode?.length || 0} characters)
        </div>
        <pre class="code-preview">${escapeHtml(session.modifiedCode || 'No code available')}</pre>
      </div>
      
      ${session.originalCode !== session.modifiedCode ? `
      <div class="code-card">
        <h2>Original Code (for comparison)</h2>
        <pre class="code-preview">${escapeHtml(session.originalCode?.substring(0, 2000) + '...' || 'No original code available')}</pre>
      </div>
      ` : ''}
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
};

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

module.exports = { newApplyCodeChangesToHtml };