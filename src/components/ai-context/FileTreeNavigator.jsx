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
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'backend', 'src/components', 'src/pages', 'backend/src']));
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTree, setFileTree] = useState(null);

  // Load real file tree data from API
  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    try {
      // Fetch file listing from API - now loads the entire codebase from root
      const data = await apiClient.get('proxy-source-files/list?path=.');
      
      if (data && data.success && data.files) {
        // Convert flat file list to hierarchical tree structure
        const tree = buildFileTree(data.files);
        setFileTree(tree);
      } else {
        console.error('Failed to load file tree:', data?.message || 'Unknown error');
        // Fallback to a simple error state
        setFileTree({
          name: 'Catalyst Project',
          type: 'folder',
          path: '',
          children: [
            { name: 'Error loading files', type: 'file', isError: true, path: 'error' }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
      // Fallback to error state
      setFileTree({
        name: 'Catalyst Project',
        type: 'folder',
        path: '',
        children: [
          { name: 'API Error - Check console', type: 'file', isError: true, path: 'error' }
        ]
      });
    }
  };

  // Convert flat file list to hierarchical tree structure
  const buildFileTree = (files) => {
    const tree = {
      name: 'Catalyst Project',
      type: 'folder',
      path: '',
      children: []
    };

    // Create a map to store folder references
    const folderMap = new Map();
    folderMap.set('', tree);

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
    const fileName = file.name.toLowerCase();
    
    // Special file names
    if (fileName === 'package.json') {
      return <Settings className="w-4 h-4 text-green-600" />;
    }
    if (fileName === 'readme.md' || fileName === 'claude.md') {
      return <FileText className="w-4 h-4 text-blue-600" />;
    }
    if (fileName.startsWith('.env')) {
      return <Settings className="w-4 h-4 text-yellow-600" />;
    }
    if (fileName === 'dockerfile' || fileName.endsWith('.dockerfile')) {
      return <Database className="w-4 h-4 text-blue-700" />;
    }
    
    switch (extension) {
      case 'jsx':
      case 'js':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'css':
      case 'scss':
      case 'less':
      case 'sass':
        return <Settings className="w-4 h-4 text-pink-500" />;
      case 'json':
      case 'jsonl':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'md':
      case 'txt':
      case 'log':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
      case 'ico':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'html':
      case 'htm':
        return <Globe className="w-4 h-4 text-orange-500" />;
      case 'yml':
      case 'yaml':
        return <Settings className="w-4 h-4 text-red-500" />;
      case 'xml':
        return <Code className="w-4 h-4 text-orange-600" />;
      case 'sql':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'py':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'php':
        return <Code className="w-4 h-4 text-purple-600" />;
      case 'java':
        return <Code className="w-4 h-4 text-red-600" />;
      case 'go':
        return <Code className="w-4 h-4 text-cyan-500" />;
      case 'rs':
        return <Code className="w-4 h-4 text-orange-700" />;
      case 'sh':
      case 'bash':
      case 'zsh':
        return <Settings className="w-4 h-4 text-gray-600" />;
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
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Project Files</h3>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={refreshFileTree} title="Refresh file tree">
              <RefreshCw className="w-4 h-4" />
            </Button>
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