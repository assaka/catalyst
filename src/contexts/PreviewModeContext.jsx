import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * PreviewModeContext - Stores whether we're in draft preview mode
 * This persists across navigation within the storefront so that
 * clicking links doesn't lose the preview mode state.
 */
const PreviewModeContext = createContext({
  isPreviewDraftMode: false,
});

export function PreviewModeProvider({ children }) {
  const [isPreviewDraftMode, setIsPreviewDraftMode] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check URL params on initial load only
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized) {
      const urlParams = new URLSearchParams(window.location.search);
      const previewParam = urlParams.get('preview');
      const workspaceParam = urlParams.get('workspace');

      const isDraftMode = previewParam === 'draft' || workspaceParam === 'true';

      setIsPreviewDraftMode(isDraftMode);
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <PreviewModeContext.Provider value={{ isPreviewDraftMode, initialized }}>
      {children}
    </PreviewModeContext.Provider>
  );
}

export function usePreviewMode() {
  const context = useContext(PreviewModeContext);
  if (!context) {
    // Not inside provider - check URL directly
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        isPreviewDraftMode: urlParams.get('preview') === 'draft' || urlParams.get('workspace') === 'true',
        initialized: true
      };
    }
    return { isPreviewDraftMode: false, initialized: false };
  }
  return context;
}

export default PreviewModeContext;
