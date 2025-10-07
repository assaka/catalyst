import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ResponsiveIframe - Renders content in an iframe with viewport constraints
 * This enables true responsive behavior without transforming classes
 */
export function ResponsiveIframe({ viewport = 'desktop', children, className = '' }) {
  const iframeRef = useRef(null);
  const [iframeDocument, setIframeDocument] = useState(null);

  const getViewportStyles = () => {
    switch (viewport) {
      case 'mobile':
        return { width: '375px', minHeight: '667px' };
      case 'tablet':
        return { width: '768px', minHeight: '1024px' };
      case 'desktop':
      default:
        return { width: '100%', minHeight: 'auto' };
    }
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Set up iframe document
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="/src/index.css">
          <style>
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for styles to load
    const checkStylesLoaded = setInterval(() => {
      const rootDiv = iframeDoc.getElementById('root');
      if (rootDiv) {
        clearInterval(checkStylesLoaded);
        setIframeDocument(iframeDoc);
      }
    }, 100);

    return () => {
      clearInterval(checkStylesLoaded);
    };
  }, [viewport]);

  const viewportStyles = getViewportStyles();
  const wrapperClass = viewport === 'desktop'
    ? className
    : `${className} mx-auto bg-gray-50 py-4`;

  return (
    <div className={wrapperClass}>
      <iframe
        ref={iframeRef}
        style={{
          ...viewportStyles,
          border: viewport === 'desktop' ? 'none' : '1px solid #e5e7eb',
          borderRadius: viewport === 'desktop' ? '0' : '8px',
          boxShadow: viewport === 'desktop' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'block',
          margin: viewport === 'desktop' ? '0' : '0 auto'
        }}
        title="Responsive Preview"
      />
      {iframeDocument && createPortal(
        children,
        iframeDocument.getElementById('root')
      )}
    </div>
  );
}
