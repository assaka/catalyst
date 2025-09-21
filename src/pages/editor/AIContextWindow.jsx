import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import {Download, Eye, Upload, RefreshCw, CheckCircle, Maximize2, Minimize2, History, ShoppingCart, Package, Home, CreditCard, CheckCheck, Grid3X3} from 'lucide-react';
import { cn } from '@/lib/utils';
import SlotEnabledFileSelector from '@/components/editor/ai-context/SlotEnabledFileSelector';
import CodeEditor from '@/components/editor/ai-context/CodeEditor';
import AIContextWindow from '@/components/editor/ai-context/AIContextWindow';
import CartSlotsEditor from '@/pages/editor/CartSlotsEditor';
import CategorySlotsEditor from '@/pages/editor/CategorySlotsEditor';
import apiClient from '@/api/client';
import { SlotConfiguration } from '@/api/entities';
import slotConfigurationService from '@/services/slotConfigurationService';
// VersionHistoryModal removed - functionality integrated into unified editor
import { useStoreSelection } from '@/contexts/StoreSelectionContext';

/**
 * Get language type from filename
 */
const getLanguageFromFileName = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'javascript';
  }
};

/**
 * Apply JSON Patch operations to source code
 * This is a simple implementation for basic patch operations
 * @param {string} sourceCode - Original source code
 * @param {Array} patch - JSON Patch operations (RFC 6902)
 * @returns {string} Modified source code
 */
const applyPatchToCode = (sourceCode, patch) => {
  if (!patch || !Array.isArray(patch)) return sourceCode;
  
  let lines = sourceCode.split('\n');
  
  // Apply each patch operation
  patch.forEach(operation => {
    try {
      switch (operation.op) {
        case 'add':
          // Simple line-based addition
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber <= lines.length) {
              lines.splice(lineNumber, 0, operation.value);
            }
          }
          break;
          
        case 'replace':
          // Simple line-based replacement
          if (operation.path.includes('/line/')) {
            const lineNumber = parseInt(operation.path.split('/line/')[1]);
            if (lineNumber >= 0 && lineNumber < lines.length) {
              lines[lineNumber] = operation.value;
            }
          }
          break;
          
        case 'remove':
          // Simple line-based removal
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

// Removed obsolete applySemanticDiffsToCode function - no longer used

// Removed obsolete semantic diff helper functions - no longer used

/**
 * Create a simple hash for code comparison
 */
const createSimpleHash = (content) => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

/**
 * AI Context Window Page
 * Main interface for natural language code editing with AST-aware intelligence
 * Integrates file navigation, code editing, AI processing, and live preview
 */
// Function to get user-friendly display name and icon based on filename
const getFileDisplayInfo = (filename) => {
  if (!filename) return { name: '', icon: null };

  const name = filename.toLowerCase();

  // Map filenames to user-friendly names and icons
  if (name.includes('cart')) {
    return {
      name: 'Cart',
      icon: ShoppingCart
    };
  }

  if (name.includes('product')) {
    return {
      name: 'Product page',
      icon: Package
    };
  }

  if (name.includes('category')) {
    return {
      name: 'Category page',
      icon: Package
    };
  }

  if (name.includes('homepage') || name.includes('home')) {
    return {
      name: 'Homepage',
      icon: Home
    };
  }

  if (name.includes('checkout')) {
    return {
      name: 'Checkout page',
      icon: CreditCard
    };
  }

  if (name.includes('success')) {
    return {
      name: 'Success page',
      icon: CheckCheck
    };
  }

  // Default fallback
  return {
    name: filename,
    icon: null
  };
};

// Define the slot-enabled files with their metadata
const slotEnabledFiles = [
  {
    id: 'cart',
    name: 'Cart',
    path: 'src/pages/editor/CartSlotsEditor.jsx',
    pageType: 'cart',
    icon: ShoppingCart,
    description: 'Shopping cart page with slot customization',
    color: 'text-blue-500'
  },
  {
    id: 'category',
    name: 'Category',
    path: 'src/pages/editor/CategorySlotsEditor.jsx',
    pageType: 'category',
    icon: Grid3X3,
    description: 'Product category listing page',
    color: 'text-green-500'
  },
  {
    id: 'product',
    name: 'Product',
    path: 'src/pages/editor/ProductSlotsEditor.jsx',
    pageType: 'product',
    icon: Package,
    description: 'Product detail page with customizable slots',
    color: 'text-purple-500'
  },
  {
    id: 'checkout',
    name: 'Checkout',
    path: 'src/pages/editor/CheckoutSlotsEditor.jsx',
    pageType: 'checkout',
    icon: CreditCard,
    description: 'Checkout flow with payment integration',
    color: 'text-orange-500'
  },
  {
    id: 'success',
    name: 'Success',
    path: 'src/pages/editor/SuccessSlotsEditor.jsx',
    pageType: 'success',
    icon: CheckCircle,
    description: 'Order confirmation and success page',
    color: 'text-emerald-500'
  }
];

const AIContextWindowPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getSelectedStoreId } = useStoreSelection();
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSlotEditor, setSelectedSlotEditor] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [originalCode, setOriginalCode] = useState(''); // Store original baseline for diff detection
  const [baselineCode, setBaselineCode] = useState(''); // Store actual file baseline for semantic diffs
  const [modifiedFiles, setModifiedFiles] = useState([]);
  const [currentPatch, setCurrentPatch] = useState(null);
  const [connectionStatus] = useState(null);
  const [astDiffStatus] = useState(null); // Track AST diff creation status
  const [manualEditResult, setManualEditResult] = useState(null); // Track manual edit detection
  const [setPreviewMode] = useState('hybrid'); // Track preview mode: 'hybrid' (Customize tab is default)
  const [isFileLoading, setIsFileLoading] = useState(false);
  
  // Slot configuration publishing state
  // Version history functionality integrated into UnifiedSlotEditor
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Auto-save debounce timer
  const autoSaveTimeoutRef = useRef(null);

  // Check authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount and when needed
  useEffect(() => {
    const checkAuth = () => {
      const authToken = apiClient.getToken();
      setIsAuthenticated(!!authToken);
    };
    
    checkAuth();
    
    // Check auth status when localStorage changes (e.g., user logs in/out)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load file from URL parameter on mount
  useEffect(() => {
    const filePath = searchParams.get('file');
    if (filePath) {
      loadFileContent(filePath);
    }
  }, [searchParams]);
  
  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);



  // Helper function to fetch baseline code from database
  // Helper function to normalize line endings for comparison
  const normalizeLineEndings = useCallback((content) => {
    if (typeof content !== 'string') return content;
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }, []);

  const fetchBaselineCode = useCallback(async (filePath, fallbackContent) => {
    try {
      const baselineData = await apiClient.get(`extensions/baseline/${encodeURIComponent(filePath)}`);
      if (baselineData && baselineData.success && baselineData.data.hasBaseline) {
        return normalizeLineEndings(baselineData.data.baselineCode);
      } else {
        return normalizeLineEndings(fallbackContent);
      }
    } catch (baselineError) {
      console.error('Failed to fetch baseline, using current content:', baselineError);
      return normalizeLineEndings(fallbackContent);
    }
  }, [normalizeLineEndings]);

  // Load file content
  const loadFileContent = useCallback(async (filePath) => {
    setIsFileLoading(true);
    try {
      // Load baseline code directly
      const data = await apiClient.get(`extensions/baseline/${encodeURIComponent(filePath)}`);

      if (data && data.success && data.data.hasBaseline) {
        const baselineCode = normalizeLineEndings(data.data.baselineCode);
        setSourceCode(baselineCode);
        
        // Keep original baseline code for comparison
        setOriginalCode(baselineCode);
        const fileObj = {
          path: filePath,
          name: filePath.split('/').pop(),
          type: 'file',
          isSupported: true
        };
        setSelectedFile(fileObj);
        
        // Update URL
        setSearchParams({ file: filePath });
      } else if (data && data.success && !data.data.hasBaseline) {
      } else {
        console.error('Failed to load file:', data?.message || 'Unknown error');
        // Provide detailed diagnostic information

        setSourceCode(normalizeLineEndings(diagnosticInfo));
        const baselineCode = await fetchBaselineCode(filePath, diagnosticInfo);
        setOriginalCode(baselineCode); // Set baseline for diff detection
        setBaselineCode(baselineCode); // Store actual baseline for semantic diffs
        setSelectedFile({
          path: filePath,
          name: filePath.split('/').pop() || 'unknown.js',
          type: 'file',
          isSupported: true
        });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      
      // Enhanced error handling for API client errors
      let errorInfo = '';
      let errorType = 'Network Error';
      let troubleshooting = [];
      
      if (error.message.includes('Network error: Unable to connect to server')) {
        errorType = 'Backend Server Offline';
        troubleshooting = [
          'The backend server is not responding',
          'Verify backend is deployed and running on Render',
          'Check Render dashboard for deployment status',
          'Review Render logs for server errors'
        ];
      } else if (error.status === 401) {
        errorType = 'Authentication Error';
        troubleshooting = [
          'Please log in as a store owner',
          'Verify authentication token is valid',
          'Try refreshing the page and logging in again'
        ];
      } else if (error.status === 403) {
        errorType = 'Access Denied';
        troubleshooting = [
          'File path may be outside allowed directories',
          'Check if file path starts with "src/"',
          'Verify you have store owner permissions'
        ];
      } else if (error.status === 404) {
        errorType = 'File Not Found';
        troubleshooting = [
          'Check if the file exists at the specified path',
          'Verify the file path is correct',
          'Try selecting a different file from the tree'
        ];
      } else {
        troubleshooting = [
          'Check network connection to backend server',
          'Verify backend is deployed and accessible',
          'Contact system administrator if issue persists'
        ];
      }
      
      errorInfo = `// ${errorType}: ${error.message}
// File Path: ${filePath}
// Backend: ${import.meta.env.VITE_API_BASE_URL || 'Not configured'}
// 
// Troubleshooting Steps:
${troubleshooting.map((step, i) => `// ${i + 1}. ${step}`).join('\n')}
//
// You can still test the AI Context Window with this placeholder
//`;
      
      // Fallback for demo purposes
      const fallbackContent = errorInfo + `
import React, { useState, useEffect } from 'react';

const ExampleComponent = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default ExampleComponent;`;

      setSourceCode(normalizeLineEndings(fallbackContent));
      const baselineCode = await fetchBaselineCode(filePath, fallbackContent);
      setOriginalCode(baselineCode); // Set baseline for diff detection

      setSelectedFile({
        path: filePath,
        name: filePath.split('/').pop() || 'demo.jsx',
        type: 'file',
        isSupported: true
      });
    } finally {
      setIsFileLoading(false);
    }
  }, [setSearchParams, normalizeLineEndings]);

  // Handle file selection from tree navigator
  const handleFileSelect = useCallback((slotFile) => {
    console.log('Slot editor selected:', slotFile);
    setSelectedSlotEditor(slotFile);
    setSelectedFile(slotFile); // Keep this for compatibility
  }, []);

  // Handle patch generation from AI Context Window
  const handlePatchGenerated = useCallback((patch) => {
    setCurrentPatch(patch);
  }, []);

  // Handle preview generation - simplified without patch storage
  const handlePreviewGenerated = useCallback(async (preview) => {
    console.log('Preview generated:', preview);
    // Preview functionality simplified - no more patch storage
  }, []);

  return (
    <div className={`min-h-[calc(100vh-100px)] flex flex-col bg-gray-50 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            AI Context Window
          </h1>
        </div>

        {/* Slot Editor Status */}
        <div className="flex items-center space-x-4">
          {selectedSlotEditor && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Editing: {selectedSlotEditor.name}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {isFullscreen ? (
          // Fullscreen mode - single panel without ResizablePanelGroup
          <div className="h-full w-full">
            <div className="h-[calc(100vh-200px)] flex flex-col">
              {selectedSlotEditor ? (
                <>
                  {/* Slot Editor Header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                    <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center px-4 py-2">
                        {(() => {
                          const IconComponent = selectedSlotEditor.icon;
                          return (
                            <div className="flex items-center text-sm font-medium">
                              {IconComponent && (
                                <IconComponent className={`w-4 h-4 mr-2 ${selectedSlotEditor.color}`} />
                              )}
                              <span className="text-gray-900 dark:text-gray-100">{selectedSlotEditor.name} Editor</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">- {selectedSlotEditor.description}</span>
                            </div>
                          );
                        })()}
                      </div>
                      <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Slot Editor Content */}
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      const handleSave = async (configToSave) => {
                        try {
                          const storeId = getSelectedStoreId();
                          const response = await slotConfigurationService.saveConfiguration(storeId, configToSave, selectedSlotEditor.pageType);
                          console.log('✅ Configuration saved successfully:', response);
                          return response;
                        } catch (error) {
                          console.error(`❌ Failed to save ${selectedSlotEditor.pageType} configuration:`, error);
                          throw error;
                        }
                      };

                      switch (selectedSlotEditor.pageType) {
                        case 'category':
                          return (
                            <CategorySlotsEditor
                              mode="edit"
                              viewMode="grid"
                              onSave={handleSave}
                            />
                          );
                        case 'cart':
                          return (
                            <CartSlotsEditor
                              mode="edit"
                              viewMode="emptyCart"
                              slotType={selectedSlotEditor.pageType}
                              onSave={handleSave}
                            />
                          );
                        default:
                          // For other slot types, use CartSlotsEditor for now
                          return (
                            <CartSlotsEditor
                              mode="edit"
                              viewMode="emptyCart"
                              slotType={selectedSlotEditor.pageType}
                              onSave={handleSave}
                            />
                          );
                      }
                    })()}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                    <p className="text-lg mb-2">Select a slot editor from the left panel</p>
                    <p className="text-sm">Choose Cart, Category, Product, Checkout, or Success to start editing page layouts with the slot system.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Normal mode with ResizablePanelGroup
          <ResizablePanelGroup 
            direction="horizontal" 
            className="h-[calc(100vh-200px)]"
            autoSaveId="ai-context-window-v2"
          >
            {/* AI Context Window - First Column */}
            <ResizablePanel
              defaultSize={25}
              minSize={15}
              maxSize={25}
            >
              <AIContextWindow
                sourceCode={sourceCode}
                filePath={selectedFile?.path || ''}
                onPatchGenerated={handlePatchGenerated}
                onPreviewGenerated={handlePreviewGenerated}
                className="h-full"
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* File Tree Navigator */}
            <ResizablePanel 
              defaultSize={14}
              minSize={14}
              maxSize={14}
            >
              <SlotEnabledFileSelector
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                className="h-[calc(100vh-200px)]"
                files={slotEnabledFiles}
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* Code Editor and Preview Panel */}
            <ResizablePanel 
              defaultSize={60}
              minSize={40}
              maxSize={60}
            >
              <div className="h-[calc(100vh-200px)] flex flex-col">
                {selectedSlotEditor ? (
                  <>
                    {/* Slot Editor Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
                      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center px-4 py-2">
                          {(() => {
                            const IconComponent = selectedSlotEditor.icon;
                            return (
                              <div className="flex items-center text-sm font-medium">
                                {IconComponent && (
                                  <IconComponent className={`w-4 h-4 mr-2 ${selectedSlotEditor.color}`} />
                                )}
                                <span className="text-gray-900 dark:text-gray-100">{selectedSlotEditor.name} Editor</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">- {selectedSlotEditor.description}</span>
                              </div>
                            );
                          })()}
                        </div>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="mr-3 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Slot Editor Content */}
                    <div className="flex-1 overflow-hidden">
                      {(() => {
                        const handleSave = async (configToSave) => {
                          try {
                            const storeId = getSelectedStoreId();
                            const response = await slotConfigurationService.saveConfiguration(storeId, configToSave, selectedSlotEditor.pageType);
                            console.log('✅ Configuration saved successfully:', response);
                            return response;
                          } catch (error) {
                            console.error(`❌ Failed to save ${selectedSlotEditor.pageType} configuration:`, error);
                            throw error;
                          }
                        };

                        switch (selectedSlotEditor.pageType) {
                          case 'category':
                            return (
                              <CategorySlotsEditor
                                mode="edit"
                                viewMode="grid"
                                onSave={handleSave}
                              />
                            );
                          case 'cart':
                            return (
                              <CartSlotsEditor
                                mode="edit"
                                viewMode="emptyCart"
                                slotType={selectedSlotEditor.pageType}
                                onSave={handleSave}
                              />
                            );
                          default:
                            // For other slot types, use CartSlotsEditor for now
                            return (
                              <CartSlotsEditor
                                mode="edit"
                                viewMode="emptyCart"
                                slotType={selectedSlotEditor.pageType}
                                onSave={handleSave}
                              />
                            );
                        }
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                      <p className="text-lg mb-2">Select a slot editor from the left panel</p>
                      <p className="text-sm">Choose Cart, Category, Product, Checkout, or Success to start editing page layouts with the slot system.</p>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t bg-white dark:bg-gray-800 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>AI Context Window v1.0</span>
          {selectedFile && (
            <span>
              {sourceCode.split('\n').length} lines
              • {sourceCode.length} characters
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {modifiedFiles.length > 0 && (
            <span>{modifiedFiles.length} modified file{modifiedFiles.length !== 1 ? 's' : ''}</span>
          )}
          {currentPatch && (
            <span className="text-orange-600 dark:text-orange-400">Patch Ready</span>
          )}
          <span>Ready</span>
        </div>
      </div>

      {/* Version history functionality available in UnifiedSlotEditor */}
    </div>
  );
};

export default AIContextWindowPage;