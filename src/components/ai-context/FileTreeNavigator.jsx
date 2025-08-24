import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';

/**
 * File Tree Navigator Component
 * Virtualized tree view for file navigation with modification indicators
 * Supports right-click operations and expandable directories
 */
const FileTreeNavigator = ({ 
  onFileSelect, 
  selectedFile, 
  modifiedFiles = [], 
  className,
  showHidden = false,
  searchTerm = '',
  onRefresh
}) => {
  const [fileTree, setFileTree] = useState([]);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [filesWithPatches, setFilesWithPatches] = useState(new Set());

  // Get supported file types for the AI Context Window
  const getSupportedFileTypes = () => [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.less',
    '.html', '.htm', '.xml', '.md', '.txt', '.py', '.java', '.c', '.cpp',
    '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
    '.scala', '.clj', '.elm', '.hs', '.ml', '.fs', '.vb', '.sql'
  ];

  // Demo file tree representing the current codebase
  const getDemoFileTree = () => [
    {
      name: 'src',
      type: 'directory',
      path: 'src',
      children: [
        {
          name: 'components',
          type: 'directory',
          path: 'src/components',
          children: [
            {
              name: 'ui',
              type: 'directory',
              path: 'src/components/ui',
              children: [
                { name: 'button.jsx', type: 'file', path: 'src/components/ui/button.jsx', isSupported: true, extension: '.jsx' },
                { name: 'input.jsx', type: 'file', path: 'src/components/ui/input.jsx', isSupported: true, extension: '.jsx' },
                { name: 'card.jsx', type: 'file', path: 'src/components/ui/card.jsx', isSupported: true, extension: '.jsx' }
              ]
            },
            {
              name: 'shared',
              type: 'directory',
              path: 'src/components/shared',
              children: [
                { name: 'ModeHeader.jsx', type: 'file', path: 'src/components/shared/ModeHeader.jsx', isSupported: true, extension: '.jsx' },
                { name: 'Header.jsx', type: 'file', path: 'src/components/shared/Header.jsx', isSupported: true, extension: '.jsx' }
              ]
            },
            {
              name: 'ai-context',
              type: 'directory', 
              path: 'src/components/ai-context',
              children: [
                { name: 'FileTreeNavigator.jsx', type: 'file', path: 'src/components/ai-context/FileTreeNavigator.jsx', isSupported: true, extension: '.jsx' },
                { name: 'CodeEditor.jsx', type: 'file', path: 'src/components/ai-context/CodeEditor.jsx', isSupported: true, extension: '.jsx' },
                { name: 'AIContextWindow.jsx', type: 'file', path: 'src/components/ai-context/AIContextWindow.jsx', isSupported: true, extension: '.jsx' },
                { name: 'BrowserPreview.jsx', type: 'file', path: 'src/components/ai-context/BrowserPreview.jsx', isSupported: true, extension: '.jsx' },
                { name: 'DiffPreviewSystem.jsx', type: 'file', path: 'src/components/ai-context/DiffPreviewSystem.jsx', isSupported: true, extension: '.jsx' }
              ]
            }
          ]
        },
        {
          name: 'pages',
          type: 'directory',
          path: 'src/pages',
          children: [
            { name: 'index.jsx', type: 'file', path: 'src/pages/index.jsx', isSupported: true, extension: '.jsx' },
            { name: 'Layout.jsx', type: 'file', path: 'src/pages/Layout.jsx', isSupported: true, extension: '.jsx' },
            { name: 'Dashboard.jsx', type: 'file', path: 'src/pages/Dashboard.jsx', isSupported: true, extension: '.jsx' },
            { name: 'Products.jsx', type: 'file', path: 'src/pages/Products.jsx', isSupported: true, extension: '.jsx' },
            { name: 'AIContextWindow.jsx', type: 'file', path: 'src/pages/AIContextWindow.jsx', isSupported: true, extension: '.jsx' }
          ]
        },
        {
          name: 'hooks',
          type: 'directory',
          path: 'src/hooks',
          children: [
            { name: 'useAuth.js', type: 'file', path: 'src/hooks/useAuth.js', isSupported: true, extension: '.js' },
            { name: 'useRoleProtection.js', type: 'file', path: 'src/hooks/useRoleProtection.js', isSupported: true, extension: '.js' }
          ]
        },
        {
          name: 'utils',
          type: 'directory',
          path: 'src/utils',
          children: [
            { name: 'index.js', type: 'file', path: 'src/utils/index.js', isSupported: true, extension: '.js' },
            { name: 'auth.js', type: 'file', path: 'src/utils/auth.js', isSupported: true, extension: '.js' },
            { name: 'urlUtils.js', type: 'file', path: 'src/utils/urlUtils.js', isSupported: true, extension: '.js' }
          ]
        }
      ]
    },
    {
      name: 'backend',
      type: 'directory',
      path: 'backend',
      children: [
        {
          name: 'src',
          type: 'directory',
          path: 'backend/src',
          children: [
            {
              name: 'routes',
              type: 'directory',
              path: 'backend/src/routes',
              children: [
                { name: 'auth.js', type: 'file', path: 'backend/src/routes/auth.js', isSupported: true, extension: '.js' },
                { name: 'products.js', type: 'file', path: 'backend/src/routes/products.js', isSupported: true, extension: '.js' },
                { name: 'ai-context.js', type: 'file', path: 'backend/src/routes/ai-context.js', isSupported: true, extension: '.js' }
              ]
            },
            {
              name: 'services',
              type: 'directory',
              path: 'backend/src/services',
              children: [
                { name: 'ast-analyzer.js', type: 'file', path: 'backend/src/services/ast-analyzer.js', isSupported: true, extension: '.js' },
                { name: 'json-patch-service.js', type: 'file', path: 'backend/src/services/json-patch-service.js', isSupported: true, extension: '.js' },
                { name: 'conflict-detector.js', type: 'file', path: 'backend/src/services/conflict-detector.js', isSupported: true, extension: '.js' }
              ]
            },
            {
              name: 'models',
              type: 'directory',
              path: 'backend/src/models',
              children: [
                { name: 'index.js', type: 'file', path: 'backend/src/models/index.js', isSupported: true, extension: '.js' },
                { name: 'User.js', type: 'file', path: 'backend/src/models/User.js', isSupported: true, extension: '.js' },
                { name: 'Product.js', type: 'file', path: 'backend/src/models/Product.js', isSupported: true, extension: '.js' }
              ]
            }
          ]
        }
      ]
    },
    { name: 'package.json', type: 'file', path: 'package.json', isSupported: true, extension: '.json' },
    { name: 'README.md', type: 'file', path: 'README.md', isSupported: true, extension: '.md' },
    { name: '.gitignore', type: 'file', path: '.gitignore', isSupported: true, extension: '' }
  ];

  // Fetch file tree from backend with fallback to demo
  const fetchFileTree = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('proxy-source-files/list?path=src');
      console.log('🔍 Raw API response:', data);

      // Handle both transformed array response and original wrapped response
      let files = [];
      let success = false;
      
      if (Array.isArray(data)) {
        // API client transformed the response and returned just the files array
        files = data;
        success = files.length > 0;
        console.log('📋 Using transformed array response with', files.length, 'files');
      } else if (data && data.success === true && data.files) {
        // Original wrapped response format
        files = data.files;
        success = true;
        console.log('📋 Using wrapped response format with', files.length, 'files');
      } else if (data && data.success === false) {
        // API explicitly returned failure
        console.log('❌ API returned failure:', data.message || 'Unknown error');
        success = false;
      } else {
        // Unrecognized response format - treat as failure
        console.log('❌ Unrecognized response format:', data);
        success = false;
      }

      // Only proceed if we have a successful response with files
      if (success && files && Array.isArray(files) && files.length > 0) {
        console.log(`📁 Found ${files.length} files from API`);
        
        // Validate file structure before processing
        const validFiles = files.filter(file => {
          return file && 
                 typeof file.path === 'string' && 
                 file.path.length > 0 &&
                 typeof file.type === 'string';
        });
        
        if (validFiles.length === 0) {
          console.log('❌ No valid files found in API response');
          throw new Error('No valid files in API response');
        }
        
        // Convert the flat file list to a tree structure
        const convertToTree = (fileList) => {
          const tree = [];
          const pathMap = new Map();
          
          // Create tree structure from flat file list
          fileList.forEach(file => {
            try {
              const parts = file.path.split('/');
              let currentPath = '';
              let currentLevel = tree;
              
              parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (!pathMap.has(currentPath)) {
                  const isFile = index === parts.length - 1 && file.type === 'file';
                  const extension = isFile ? (file.extension || '') : null;
                  const isSupported = isFile ? getSupportedFileTypes().includes(extension) : true;
                  
                  const node = {
                    name: part,
                    path: currentPath,
                    type: isFile ? 'file' : 'directory',
                    children: isFile ? undefined : [],
                    isSupported: isSupported,
                    extension: extension
                  };
                  
                  pathMap.set(currentPath, node);
                  currentLevel.push(node);
                  currentLevel = node.children || [];
                } else {
                  currentLevel = pathMap.get(currentPath).children || [];
                }
              });
            } catch (fileError) {
              console.warn('Failed to process file:', file.path, fileError);
            }
          });
          
          return tree;
        };
        
        const tree = convertToTree(validFiles);
        
        // Only set tree if it's not empty
        if (tree.length > 0) {
          setFileTree(tree);
          setLoading(false);
          return;
        } else {
          console.log('❌ Converted tree is empty, falling back to demo');
        }
      } else {
        console.log('❌ No valid files or unsuccessful response, falling back to demo');
        
        // Log diagnostic information for debugging
        if (success) {
          console.log(`🔍 Response was successful but files array was ${Array.isArray(files) ? 'empty' : 'invalid'}`);
          console.log(`📊 Files data:`, files);
        } else {
          console.log(`❌ Response was not successful. Data:`, data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch file tree from API, using demo structure:', error);
    }
    
    // Fallback to demo file tree representing the current codebase
    console.log('📁 Using demo file tree as fallback');
    setFileTree(getDemoFileTree());
    setLoading(false);
  }, []);

  // Load file tree on mount
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchFileTree();
    onRefresh?.();
  }, [fetchFileTree, onRefresh]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return fileTree;

    const filterNode = (node) => {
      const nameMatches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (node.type === 'file') {
        return nameMatches;
      }

      // For directories, include if name matches or if any children match
      const filteredChildren = node.children?.filter(filterNode) || [];
      return nameMatches || filteredChildren.length > 0;
    };

    return fileTree.filter(filterNode);
  }, [fileTree, searchTerm]);

  // Toggle directory expansion
  const toggleExpanded = useCallback((path) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Handle file selection and fetch AST diff patches
  const handleFileSelect = useCallback(async (file) => {
    if (file.type === 'file' && file.isSupported) {
      // First, trigger the normal file selection
      onFileSelect?.(file);
      
      // Then, fetch hybrid customization patches from database for this file
      try {
        console.log(`🔍 Fetching hybrid customization patches for file: ${file.path}`);
        
        const hybridPatchData = await apiClient.get(`hybrid-patches/${encodeURIComponent(file.path)}`);
        
        if (hybridPatchData && hybridPatchData.success && hybridPatchData.data) {
          const patches = hybridPatchData.data.patches || [];
          console.log(`📋 Found ${patches.length} hybrid customization patches for ${file.path}:`, patches);
          
          // Pass the patches to the parent component along with file info
          // This allows the DiffPreviewSystem or other components to use the patch data
          if (patches.length > 0) {
            const fileWithPatches = {
              ...file,
              hybridPatches: patches,
              hasPendingPatches: patches.some(p => p.metadata?.status === 'active'),
              lastPatchDate: patches[0]?.created_at || patches[0]?.createdAt
            };
            
            // Update the files with patches set to show visual indicators
            setFilesWithPatches(prev => new Set([...prev, file.path]));
            
            // Trigger a custom event or callback for hybrid patches if available
            if (window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('hybridPatchesLoaded', {
                detail: {
                  file: fileWithPatches,
                  patches: patches
                }
              }));
            }
            
            console.log(`✅ Loaded ${patches.length} hybrid patches for ${file.path}, dispatched hybridPatchesLoaded event`);
          } else {
            console.log(`📭 No hybrid customization patches found for ${file.path}`);
            // Remove from files with patches set if no patches found
            setFilesWithPatches(prev => {
              const newSet = new Set(prev);
              newSet.delete(file.path);
              return newSet;
            });
          }
        } else {
          console.log(`📭 No hybrid customization data returned for ${file.path}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch hybrid customization patches for ${file.path}:`, error.message);
        // Don't block file selection if hybrid patch fetch fails
      }
    }
  }, [onFileSelect]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e, node) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle context menu actions
  const handleContextAction = useCallback((action, node) => {
    switch (action) {
      case 'create-file':
        console.log('Create new file in:', node.path);
        break;
      case 'create-folder':
        console.log('Create new folder in:', node.path);
        break;
      case 'rename':
        console.log('Rename:', node.name);
        break;
      case 'delete':
        console.log('Delete:', node.name);
        break;
      case 'copy-path':
        navigator.clipboard.writeText(node.path);
        break;
    }
    closeContextMenu();
  }, [closeContextMenu]);

  // Render tree node
  const renderNode = useCallback((node, depth = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile?.path === node.path;
    const isModified = modifiedFiles.includes(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const hasAstPatches = filesWithPatches.has(node.path);

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer",
            "select-none transition-colors duration-150",
            isSelected && "bg-blue-100 dark:bg-blue-900",
            isModified && "bg-yellow-50 dark:bg-yellow-900/20",
            !node.isSupported && node.type === 'file' && "opacity-50"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpanded(node.path);
            } else {
              handleFileSelect(node);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Expansion toggle for directories */}
          {node.type === 'directory' && (
            <button
              className="mr-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.path);
              }}
            >
              {hasChildren && isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : hasChildren ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <div className="w-3 h-3" />
              )}
            </button>
          )}

          {/* File/folder icon */}
          <div className="mr-2 flex-shrink-0">
            {node.type === 'directory' ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              <File 
                className={cn(
                  "w-4 h-4",
                  getFileIconColor(node.extension)
                )} 
              />
            )}
          </div>

          {/* File/folder name */}
          <span 
            className={cn(
              "flex-1 truncate text-sm",
              isModified && "font-medium",
              !node.isSupported && node.type === 'file' && "text-gray-400"
            )}
          >
            {node.name}
          </span>

          {/* Modification indicator */}
          {isModified && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 ml-2" />
          )}
          
          {/* AST Patch indicator */}
          {hasAstPatches && (
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" 
              title="AST diff patches available"
            />
          )}
        </div>

        {/* Render children if expanded */}
        {node.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedDirs, selectedFile, modifiedFiles, filesWithPatches, toggleExpanded, handleFileSelect, handleContextMenu]);

  // Get file icon color based on extension
  const getFileIconColor = (extension) => {
    const colorMap = {
      '.js': 'text-yellow-500',
      '.jsx': 'text-blue-500',
      '.ts': 'text-blue-600',
      '.tsx': 'text-blue-600',
      '.json': 'text-green-500',
      '.css': 'text-pink-500',
      '.html': 'text-orange-500',
      '.md': 'text-gray-600',
      '.py': 'text-green-600',
      '.java': 'text-red-500',
      '.cpp': 'text-blue-700',
      '.c': 'text-blue-700'
    };
    return colorMap[extension] || 'text-gray-500';
  };

  return (
    <div 
      className={cn("h-full flex flex-col bg-white dark:bg-gray-900 border-r", className)}
      onClick={closeContextMenu}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          File Explorer
        </h3>
        <div className="flex items-center space-x-1">
          {/* Debug buttons - remove in production */}
          <button
            onClick={async () => {
              console.log('🧪 Testing GitHub API...');
              try {
                const testData = await apiClient.get('proxy-source-files/test-github');
                console.log('🧪 Test GitHub API response:', testData);
              } catch (error) {
                console.error('🧪 Test GitHub API failed:', error);
              }
            }}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            title="Test GitHub API"
          >
            Test
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading files...</span>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          <div className="py-1">
            {filteredTree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[150px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node.type === 'directory' && (
            <>
              <ContextMenuItem
                icon={<Plus className="w-4 h-4" />}
                label="New File"
                onClick={() => handleContextAction('create-file', contextMenu.node)}
              />
              <ContextMenuItem
                icon={<Folder className="w-4 h-4" />}
                label="New Folder"
                onClick={() => handleContextAction('create-folder', contextMenu.node)}
              />
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            </>
          )}
          <ContextMenuItem
            label="Rename"
            onClick={() => handleContextAction('rename', contextMenu.node)}
          />
          <ContextMenuItem
            label="Copy Path"
            onClick={() => handleContextAction('copy-path', contextMenu.node)}
          />
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <ContextMenuItem
            label="Delete"
            onClick={() => handleContextAction('delete', contextMenu.node)}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          />
        </div>
      )}
    </div>
  );
};

// Context menu item component
const ContextMenuItem = ({ icon, label, onClick, className }) => (
  <button
    className={cn(
      "w-full flex items-center px-3 py-2 text-sm text-left",
      "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
      className
    )}
    onClick={onClick}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {label}
  </button>
);

export default FileTreeNavigator;