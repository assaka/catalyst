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
  RefreshCw,
  Minimize2,
  Maximize2,
  Square,
  ChevronLeft
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
  const [isFolded, setIsFolded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Load real file tree data from API
  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    try {
      console.log('🔍 FileTreeNavigator: Loading file tree from API...');
      // Fetch file listing from API
      const data = await apiClient.get('proxy-source-files/list?path=src');
      
      console.log('📡 FileTreeNavigator: API Response:', data);
      
      if (data && data.success && data.files) {
        console.log('✅ FileTreeNavigator: Got', data.files.length, 'files from API');
        console.log('📁 FileTreeNavigator: Sample files:', data.files.slice(0, 5).map(f => f.path));
        console.log('📊 FileTreeNavigator: API source:', data.source);
        
        // Convert flat file list to hierarchical tree structure
        const tree = buildFileTree(data.files);
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
      // Fallback to error state
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
    const tree = {
      name: 'src',
      type: 'folder',
      children: []
    };

    // Create a map to store folder references
    const folderMap = new Map();
    folderMap.set('src', tree);

    // Sort files by path to ensure folders are created before their children
    const sortedFiles = files.sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach(file => {
      const pathParts = file.path.split('/');
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
            extension: file.extension
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

  const refreshFileTree = () => {
    loadFileTree();
  };

  const toggleFold = () => {
    setIsFolded(prev => !prev);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const toggleMaximize = () => {
    setIsMaximized(prev => !prev);
    if (isMinimized) {
      setIsMinimized(false);
    }
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
              <span>{node.size}</span>
              <span>{node.modified}</span>
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
    <Card className={`h-full flex flex-col transition-all duration-300 ${isMaximized ? 'fixed inset-0 z-50' : ''} ${isFolded ? 'w-12 min-w-12 max-w-12' : 'w-80 min-w-80'} ${className}`}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-3">
          {!isFolded && <h3 className="font-semibold">Files</h3>}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Fold Button - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFold}
              title={isFolded ? "Unfold" : "Fold"}
            >
              {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            {/* Window controls - Only show when not folded */}
            {!isFolded && (
              <>
                {isMaximized && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMinimize}
                    title="Minimize"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMaximize}
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? <Square className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Search */}
        {!isFolded && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </div>

      {/* File Tree */}
      {!isFolded && (
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
      )}

      {/* Footer */}
      {showDetails && !isFolded && (
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