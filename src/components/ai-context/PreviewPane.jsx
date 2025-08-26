/**
 * Preview Component with Overlay System Integration
 * Provides real-time preview with hot reload capabilities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useOverlayManager } from '@/services/overlay-manager';

const PreviewPane = ({
  fileId,
  originalContent = '',
  overlayContent = '',
  language = 'javascript',
  autoRefresh = true,
  refreshInterval = 1000,
  onError,
  onPreviewReady,
  className = ''
}) => {
  // State management
  const [previewMode, setPreviewMode] = useState('overlay'); // 'original', 'overlay', 'diff'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);

  // Refs
  const iframeRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Overlay management
  const { 
    manager: overlayManager, 
    stats, 
    createOverlay, 
    getMergedContent, 
    setOriginalCode 
  } = useOverlayManager({
    defaultTTL: 60 * 60 * 1000, // 1 hour for preview
    maxOverlaysPerFile: 3
  });

  /**
   * Initialize original content
   */
  useEffect(() => {
    if (fileId && originalContent) {
      setOriginalCode(fileId, originalContent);
    }
  }, [fileId, originalContent, setOriginalCode]);

  /**
   * Create overlay when content changes
   */
  useEffect(() => {
    if (fileId && overlayContent && overlayContent !== originalContent) {
      createOverlay(fileId, overlayContent, {
        priority: 1,
        metadata: {
          language,
          source: 'editor',
          timestamp: Date.now()
        }
      });
    }
  }, [fileId, overlayContent, originalContent, language, createOverlay]);

  /**
   * Get content based on preview mode
   */
  const getPreviewContent = useCallback(() => {
    switch (previewMode) {
      case 'original':
        return originalContent;
      case 'overlay':
        return getMergedContent(fileId, 'latest') || overlayContent;
      case 'diff':
        return overlayContent; // Could show diff visualization
      default:
        return overlayContent;
    }
  }, [previewMode, originalContent, getMergedContent, fileId, overlayContent]);

  /**
   * Render preview based on language/content type
   */
  const renderPreview = useCallback((content) => {
    try {
      switch (language) {
        case 'javascript':
        case 'jsx':
        case 'typescript':
        case 'tsx':
          return renderJSXPreview(content);
        case 'html':
          return renderHTMLPreview(content);
        case 'css':
          return renderCSSPreview(content);
        case 'json':
          return renderJSONPreview(content);
        default:
          return renderTextPreview(content);
      }
    } catch (error) {
      setPreviewError(`Preview render error: ${error.message}`);
      return renderErrorPreview(error);
    }
  }, [language]);

  /**
   * Render JSX/React component preview
   */
  const renderJSXPreview = useCallback((content) => {
    if (!content) return null;

    // Create a safe iframe environment for React rendering
    const iframeDoc = iframeRef.current?.contentDocument;
    if (!iframeDoc) return null;

    try {
      // Basic JSX compilation and rendering would go here
      // This is a simplified preview - in production you'd use Babel for compilation
      
      const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Component Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 16px; }
            .preview-container { border: 1px solid #e1e5e9; border-radius: 8px; padding: 16px; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            try {
              // Wrap the component code for preview
              const PreviewComponent = () => {
                ${content}
                return React.createElement('div', { className: 'preview-container' }, 'Component Preview');
              };
              
              ReactDOM.render(React.createElement(PreviewComponent), document.getElementById('root'));
            } catch (error) {
              document.getElementById('root').innerHTML = 
                '<div style="color: red; padding: 16px;">Preview Error: ' + error.message + '</div>';
            }
          </script>
        </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(previewHTML);
      iframeDoc.close();

      setPreviewStats({
        contentLength: content.length,
        lineCount: content.split('\n').length,
        language: language
      });

    } catch (error) {
      setPreviewError(`JSX compilation error: ${error.message}`);
    }
  }, [language]);

  /**
   * Render HTML preview
   */
  const renderHTMLPreview = useCallback((content) => {
    const iframeDoc = iframeRef.current?.contentDocument;
    if (!iframeDoc) return null;

    try {
      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
    } catch (error) {
      setPreviewError(`HTML preview error: ${error.message}`);
    }
  }, []);

  /**
   * Render CSS preview
   */
  const renderCSSPreview = useCallback((content) => {
    const previewHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CSS Preview</title>
        <style>${content}</style>
      </head>
      <body>
        <div style="padding: 20px;">
          <h1>CSS Preview</h1>
          <p>Your CSS styles are applied to this preview.</p>
          <button>Sample Button</button>
          <div class="sample-div">Sample div with class</div>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframeRef.current?.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(previewHTML);
      iframeDoc.close();
    }
  }, []);

  /**
   * Render JSON preview
   */
  const renderJSONPreview = useCallback((content) => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      
      const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>JSON Preview</title>
          <style>
            body { font-family: monospace; margin: 20px; }
            pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h3>JSON Preview</h3>
          <pre>${formatted}</pre>
        </body>
        </html>
      `;

      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHTML);
        iframeDoc.close();
      }
    } catch (error) {
      setPreviewError(`JSON parse error: ${error.message}`);
    }
  }, []);

  /**
   * Render text preview
   */
  const renderTextPreview = useCallback((content) => {
    const previewHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Text Preview</title>
        <style>
          body { font-family: monospace; margin: 20px; line-height: 1.5; }
          pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h3>File Preview (${language})</h3>
        <pre>${content}</pre>
      </body>
      </html>
    `;

    const iframeDoc = iframeRef.current?.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(previewHTML);
      iframeDoc.close();
    }
  }, [language]);

  /**
   * Render error preview
   */
  const renderErrorPreview = useCallback((error) => {
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Preview Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
          .error { color: #dc2626; background: #fef2f2; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; }
        </style>
      </head>
      <body>
        <div class="error">
          <h3>Preview Error</h3>
          <p>${error.message}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre>${error.stack || 'No stack trace available'}</pre>
          </details>
        </div>
      </body>
      </html>
    `;

    const iframeDoc = iframeRef.current?.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(errorHTML);
      iframeDoc.close();
    }
  }, []);

  /**
   * Refresh preview
   */
  const refreshPreview = useCallback(() => {
    setIsLoading(true);
    setPreviewError(null);

    try {
      const content = getPreviewContent();
      renderPreview(content);
      setLastRefresh(new Date());
      
      if (onPreviewReady) {
        onPreviewReady({ content, timestamp: Date.now() });
      }
    } catch (error) {
      setPreviewError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getPreviewContent, renderPreview, onPreviewReady, onError]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    if (autoRefresh && !isLoading) {
      refreshTimeoutRef.current = setTimeout(refreshPreview, refreshInterval);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshPreview, isLoading]);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshPreview();
  }, []);

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`h-full flex flex-col bg-background ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="font-medium">Preview</span>
            {previewError && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
            {!previewError && !isLoading && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            )}
            {stats.activeOverlays > 0 && (
              <Badge variant="outline" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                {stats.activeOverlays} overlay{stats.activeOverlays !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Preview Mode Toggle */}
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="overlay">Live</option>
              <option value="original">Original</option>
              <option value="diff">Diff</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshPreview}
              disabled={isLoading}
              title="Refresh Preview"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
          style={{ backgroundColor: '#ffffff' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Updating preview...</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>Mode: {previewMode}</span>
            {lastRefresh && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            {previewStats && (
              <span>{previewStats.lineCount} lines</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {previewError && (
              <span className="text-red-600" title={previewError}>
                Preview error
              </span>
            )}
            <span>{language.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPane;