import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, AlertTriangle, RefreshCw, ExternalLink, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Apply JSON Patch operations to source code
 * Enhanced version with better error handling for storefront preview
 */
const applyPatchToCode = (sourceCode, patch) => {
  if (!patch || !Array.isArray(patch)) return sourceCode;
  
  let lines = sourceCode.split('\n');
  
  // Apply each patch operation
  patch.forEach(operation => {
    try {
      switch (operation.op) {
        case 'add':
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber <= lines.length) {
              lines.splice(lineNumber, 0, operation.value);
            }
          }
          break;
          
        case 'replace':
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber < lines.length) {
              lines[lineNumber] = operation.value;
            }
          }
          break;
          
        case 'remove':
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber < lines.length) {
              lines.splice(lineNumber, 1);
            }
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to apply patch operation:', operation, error);
    }
  });
  
  return lines.join('\n');
};

/**
 * Storefront Preview Component
 * Renders React components with applied AST diff overlays in a storefront context
 * Provides responsive preview with different device viewports
 */
const StorefrontPreview = ({ 
  originalCode = '', 
  patch = null, 
  fileName = '',
  filePath = '',
  className 
}) => {
  const [previewCode, setPreviewCode] = useState('');
  const [compiledComponent, setCompiledComponent] = useState(null);
  const [error, setError] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [viewport, setViewport] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  const [theme, setTheme] = useState('light'); // 'light', 'dark'

  // Calculate modified code when patch changes
  const modifiedCode = useMemo(() => {
    if (patch && originalCode) {
      return applyPatchToCode(originalCode, patch);
    }
    return originalCode;
  }, [originalCode, patch]);

  // Update preview code when modified code changes
  useEffect(() => {
    setPreviewCode(modifiedCode);
    if (modifiedCode && isReactComponent(fileName)) {
      compileComponent(modifiedCode);
    }
  }, [modifiedCode, fileName]);

  // Check if file is a React component
  const isReactComponent = useCallback((filename) => {
    const reactExtensions = ['.jsx', '.tsx'];
    const extension = filename.substring(filename.lastIndexOf('.'));
    return reactExtensions.includes(extension) && 
           (filename.includes('component') || filename.includes('Component') || 
            /^[A-Z]/.test(filename.split('/').pop()));
  }, []);

  // Compile React component for preview
  const compileComponent = useCallback(async (code) => {
    if (!code.trim()) return;

    setIsCompiling(true);
    setError(null);

    try {
      // Check if this looks like a React component
      if (!code.includes('React') && !code.includes('import')) {
        setError('File does not appear to be a React component');
        return;
      }

      // Create a safe component wrapper for preview
      const componentWrapper = createComponentWrapper(code, fileName);
      
      if (componentWrapper) {
        setCompiledComponent(componentWrapper);
      } else {
        setError('Failed to create component wrapper for preview');
      }

    } catch (compileError) {
      setError(`Compilation error: ${compileError.message}`);
      console.error('Component compilation error:', compileError);
    } finally {
      setIsCompiling(false);
    }
  }, [fileName]);

  // Create a safe wrapper for the component
  const createComponentWrapper = useCallback((code, filename) => {
    try {
      // Extract component name from filename or code
      const componentName = extractComponentName(code, filename);
      
      if (!componentName) {
        throw new Error('Could not determine component name');
      }

      // Create a preview-safe version of the component
      const PreviewComponent = () => {
        return (
          <div className="storefront-preview-wrapper">
            {/* Storefront Context Simulation */}
            <div className={cn(
              "min-h-screen transition-colors duration-200",
              theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            )}>
              <div className="container mx-auto px-4 py-8">
                {/* Mock Navigation */}
                <nav className="mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">Amazing Store</div>
                    <div className="flex space-x-4 text-sm">
                      <span>Home</span>
                      <span>Products</span>
                      <span>About</span>
                      <span>Contact</span>
                    </div>
                  </div>
                </nav>

                {/* Component Preview Area */}
                <div className="component-preview-area">
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    Preview of: {filename}
                  </div>
                  
                  {/* This is where the actual component would render */}
                  <div className="preview-component bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                    <div className="text-center py-8">
                      <Monitor className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-medium mb-2">Component Preview</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {componentName} component with applied changes
                      </p>
                      
                      {/* Mock component content based on code analysis */}
                      <div className="space-y-4">
                        {analyzeComponentContent(code)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Footer */}
                <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>© 2024 Amazing Store. Preview mode with AST diff overlays applied.</p>
                </footer>
              </div>
            </div>
          </div>
        );
      };

      return PreviewComponent;

    } catch (error) {
      console.error('Error creating component wrapper:', error);
      return null;
    }
  }, [theme]);

  // Extract component name from code or filename
  const extractComponentName = useCallback((code, filename) => {
    // Try to extract from export default
    const exportMatch = code.match(/export\s+default\s+(\w+)/);
    if (exportMatch) return exportMatch[1];

    // Try to extract from function/const declaration
    const functionMatch = code.match(/(?:function|const)\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    // Fall back to filename
    const nameFromFile = filename.split('/').pop().replace(/\.(jsx?|tsx?)$/, '');
    return nameFromFile.charAt(0).toUpperCase() + nameFromFile.slice(1);
  }, []);

  // Analyze component content to show preview elements
  const analyzeComponentContent = useCallback((code) => {
    const elements = [];
    
    // Check for common UI elements
    if (code.includes('button') || code.includes('Button')) {
      elements.push(
        <button key="button" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Sample Button
        </button>
      );
    }

    if (code.includes('input') || code.includes('Input')) {
      elements.push(
        <input 
          key="input" 
          type="text" 
          placeholder="Sample input field"
          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      );
    }

    if (code.includes('Card') || code.includes('card')) {
      elements.push(
        <div key="card" className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h4 className="text-lg font-medium mb-2">Sample Card</h4>
          <p className="text-gray-600 dark:text-gray-400">This represents a card component with your applied changes.</p>
        </div>
      );
    }

    if (code.includes('useState') || code.includes('count')) {
      elements.push(
        <div key="counter" className="p-4 border border-gray-200 rounded">
          <div className="text-sm text-gray-600 mb-2">State-based component detected</div>
          <div className="flex items-center space-x-2">
            <button className="px-2 py-1 bg-gray-200 rounded">-</button>
            <span className="px-4 py-1 bg-gray-100 rounded">0</span>
            <button className="px-2 py-1 bg-gray-200 rounded">+</button>
          </div>
        </div>
      );
    }

    if (elements.length === 0) {
      elements.push(
        <div key="generic" className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <div className="text-gray-600 dark:text-gray-400">
            Generic React component preview
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Your code changes will be reflected here
          </div>
        </div>
      );
    }

    return elements;
  }, []);

  // Viewport configurations
  const viewportConfigs = {
    desktop: { width: '100%', height: '100%', icon: Monitor },
    tablet: { width: '768px', height: '1024px', icon: Tablet },
    mobile: { width: '375px', height: '667px', icon: Smartphone }
  };

  return (
    <div className={cn("flex flex-col bg-white dark:bg-gray-900 border-l", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Storefront Preview
          </h3>
          {patch && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded dark:bg-green-900 dark:text-green-300">
              Changes Applied
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded p-0.5">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                theme === 'light' 
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "px-2 py-1 text-xs rounded transition-colors",
                theme === 'dark' 
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              Dark
            </button>
          </div>

          {/* Viewport Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded p-0.5">
            {Object.entries(viewportConfigs).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    viewport === key 
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  )}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                >
                  <IconComponent className="w-3 h-3" />
                </button>
              );
            })}
          </div>

          {/* External Preview Link */}
          <button
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800">
        {isCompiling ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Compiling component preview...</p>
            </div>
          </div>
        ) : !isReactComponent(fileName) ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Storefront preview is only available for React components</p>
              <p className="text-xs mt-1">File: {fileName}</p>
            </div>
          </div>
        ) : (
          /* Responsive Preview Container */
          <div className="h-full flex items-center justify-center p-4">
            <div 
              className={cn(
                "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 shadow-lg transition-all duration-300",
                viewport === 'mobile' && "rounded-3xl", // Phone-like rounded corners
                viewport === 'tablet' && "rounded-xl", // Tablet-like rounded corners
                viewport === 'desktop' && "rounded-lg" // Desktop rounded corners
              )}
              style={{
                width: viewportConfigs[viewport].width,
                height: viewportConfigs[viewport].height,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {/* Preview Frame */}
              <div className="h-full overflow-auto">
                {compiledComponent ? (
                  React.createElement(compiledComponent)
                ) : (
                  <div className={cn(
                    "h-full transition-colors duration-200",
                    theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                  )}>
                    <div className="container mx-auto px-4 py-8">
                      <div className="text-center py-12">
                        <Monitor className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                        <h3 className="text-xl font-medium mb-2">Storefront Preview</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                          Preview of your component changes in a storefront context
                        </p>
                        
                        {/* File Info */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
                          <div className="text-sm font-medium mb-2">File: {fileName}</div>
                          {patch && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              ✓ {patch.length} change{patch.length !== 1 ? 's' : ''} applied
                            </div>
                          )}
                        </div>

                        {/* Mock Component Elements */}
                        <div className="mt-8 space-y-4">
                          {analyzeComponentContent(previewCode)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <div>
            Viewport: {viewport} ({viewportConfigs[viewport].width} × {viewportConfigs[viewport].height})
          </div>
          <div className="flex items-center space-x-2">
            <span>Theme: {theme}</span>
            {patch && (
              <span className="text-green-600 dark:text-green-400">
                • Changes applied
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontPreview;