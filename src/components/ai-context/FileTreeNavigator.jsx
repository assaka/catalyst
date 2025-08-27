import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import apiClient from '@/api/client';
import { 
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Code,
  Image,
  Settings,
  Database,
  Globe,
  RefreshCw
} from 'lucide-react';

const FileTreeNavigator = ({ 
  onFileSelect, 
  selectedFile = null, 
  showDetails = false,
  onRefresh,
  className = '' 
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'src/components', 'src/pages']));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTree, setFileTree] = useState(null);

  // Load file tree data from file_baselines
  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    try {
      console.log('🔍 FileTreeNavigator: Loading file tree from file_baselines...');
      // Fetch file baselines from API (core codebase files, no store_id needed)
      const data = await apiClient.get('patches/baselines');
      
      console.log('📡 FileTreeNavigator: API Response:', data);
      
      if (data && data.success && data.data && data.data.files) {
        console.log('✅ FileTreeNavigator: Got', data.data.files.length, 'files from baselines');
        console.log('📁 FileTreeNavigator: Sample files:', data.data.files.slice(0, 5).map(f => f.file_path));
        
        // Convert file baselines to file tree format
        const fileList = data.data.files.map(file => ({
          path: file.file_path,
          extension: file.file_path.split('.').pop(),
          size: file.file_size || 0,
          modified: file.last_modified,
          version: file.version,
          codeHash: file.code_hash,
          fileType: file.file_type
        }));
        
        // Convert flat file list to hierarchical tree structure
        const tree = buildFileTree(fileList);
        console.log('🌳 FileTreeNavigator: Built tree with', tree.children?.length || 0, 'children');
        setFileTree(tree);
      } else {
        console.error('❌ FileTreeNavigator: Failed to load file tree:', data?.message || 'Unknown error');
        console.error('❌ FileTreeNavigator: Full response:', data);
        // Fallback to a simple error state
        setFileTree({
          name: 'src',
          type: 'folder',
          children: [
            { name: 'Error loading files', type: 'file', isError: true }
          ]
        });
      }
    } catch (error) {
      console.error('❌ FileTreeNavigator: Error loading file tree:', error);
      console.error('❌ FileTreeNavigator: Error details:', error.response || error.message);
      
      // Handle authentication errors gracefully
      if (error.message && error.message.includes('authentication')) {
        console.warn('⚠️ FileTreeNavigator: Authentication issue, trying without auth...');
        
        try {
          // Fallback: Try direct fetch without authentication
          const fallbackResponse = await fetch('/api/patches/baselines');
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData && fallbackData.success && fallbackData.data && fallbackData.data.files) {
            console.log('✅ FileTreeNavigator: Fallback successful, got', fallbackData.data.files.length, 'files');
            
            const fileList = fallbackData.data.files.map(file => ({
              path: file.file_path,
              extension: file.file_path.split('.').pop(),
              size: file.file_size || 0,
              modified: file.last_modified,
              version: file.version,
              codeHash: file.code_hash,
              fileType: file.file_type
            }));
            
            const tree = buildFileTree(fileList);
            setFileTree(tree);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ FileTreeNavigator: Fallback also failed:', fallbackError);
        }
      }
      
      // Final fallback to error state
      setFileTree({
        name: 'src',
        type: 'folder', 
        children: [
          { name: 'API Error - Check console', type: 'file', isError: true }
        ]
      });
    }
  };

  // Convert flat file list to hierarchical tree structure
  const buildFileTree = (files) => {
    // Find the common root path
    const allPaths = files.map(f => f.path);
    const rootPath = findCommonRoot(allPaths);
    
    const tree = {
      name: rootPath || 'Project',
      type: 'folder',
      children: []
    };

    // Create a map to store folder references
    const folderMap = new Map();
    folderMap.set(rootPath || '', tree);

    // Sort files by path to ensure folders are created before their children
    const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      let currentParent = tree;

      // Process each path segment
      for (let i = 0; i < pathParts.length; i++) {
        const segment = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;

        if (i === pathParts.length - 1) {
          // This is the file itself
          currentParent.children.push({
            name: segment,
            type: 'file',
            path: file.path,
            extension: file.extension,
            size: file.size,
            modified: file.modified,
            version: file.version,
            codeHash: file.codeHash
          });
        } else {
          // This is a folder
          if (!folderMap.has(currentPath)) {
            const folderNode = {
              name: segment,
              type: 'folder',
              path: currentPath,
              children: []
            };
            currentParent.children.push(folderNode);
            folderMap.set(currentPath, folderNode);
          }
          currentParent = folderMap.get(currentPath);
        }
      }
    });

    return tree;
  };

  // Find the common root path among all files
  const findCommonRoot = (paths) => {
    if (!paths || paths.length === 0) return 'src';
    if (paths.length === 1) return paths[0].split('/')[0];
    
    const firstPath = paths[0].split('/');
    let commonPath = '';
    
    for (let i = 0; i < firstPath.length; i++) {
      const segment = firstPath[i];
      const isCommon = paths.every(path => {
        const parts = path.split('/');
        return parts.length > i && parts[i] === segment;
      });
      
      if (isCommon) {
        commonPath = commonPath ? `${commonPath}/${segment}` : segment;
      } else {
        break;
      }
    }
    
    return commonPath || firstPath[0] || 'Project';
  };

  const refreshFileTree = () => {
    loadFileTree();
  };

  // Format file size in human readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file, path) => {
    if (file.type === 'file') {
      onFileSelect && onFileSelect({ ...file, path });
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.path) ? (
        <FolderOpen className="w-4 h-4 text-blue-500" />
      ) : (
        <Folder className="w-4 h-4 text-blue-500" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jsx':
      case 'js':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'css':
      case 'scss':
      case 'less':
        return <Settings className="w-4 h-4 text-pink-500" />;
      case 'json':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'html':
        return <Globe className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const filterFiles = (node, searchTerm, path = '') => {
    if (!searchTerm) return node;

    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 
        { ...node, path: currentPath } : null;
    }

    if (node.type === 'folder') {
      const filteredChildren = node.children
        ?.map(child => filterFiles(child, searchTerm, currentPath))
        .filter(Boolean) || [];

      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return {
          ...node,
          path: currentPath,
          children: filteredChildren
        };
      }
    }

    return null;
  };

  const renderFileTreeNode = (node, depth = 0, path = '') => {
    if (!node) return null;

    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = expandedFolders.has(currentPath);
    const isSelected = selectedFile?.path === currentPath;
    const nodeWithPath = { ...node, path: currentPath };

    return (
      <div key={currentPath}>
        <div
          className={`flex items-center space-x-1 px-2 py-1 hover:bg-muted/50 cursor-pointer ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(currentPath);
            } else {
              handleFileClick(nodeWithPath, currentPath);
            }
          }}
        >
          {node.type === 'folder' && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          
          {getFileIcon(nodeWithPath)}
          
          <span className="flex-1 text-sm font-medium">{node.name}</span>
          
          {showDetails && node.type === 'file' && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {node.size && <span>{formatBytes(node.size)}</span>}
              {node.version && <Badge variant="secondary" className="text-xs">{node.version}</Badge>}
            </div>
          )}
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => 
              renderFileTreeNode(child, depth + 1, currentPath)
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = fileTree ? filterFiles(fileTree, searchTerm) : null;

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Files</h3>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button variant="ghost" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredTree ? (
            renderFileTreeNode(filteredTree)
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>Loading files...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {showDetails && (
        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected'}
            </span>
            <Badge variant="outline">
              {expandedFolders.size} folders open
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FileTreeNavigator;